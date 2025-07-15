import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../orders/entities/product.entity';
import { Injectable } from '@nestjs/common';
import { MistralService } from 'src/mistral/mistral.service';
import { OrderEntity } from 'src/orders/entities/order.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(ProductEntity) private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(OrderEntity) private readonly orderRepository: Repository<OrderEntity>,
    private readonly mistralService: MistralService,
  ) {}

  async searchProducts(query: string): Promise<ProductEntity[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where(
        `to_tsvector('english', product.name || ' ' || product.description || ' ' || product.category) @@ plainto_tsquery(:query)`,
        { query },
      )
      .getMany();
  }

  async searchProductsByRelevance(query: string): Promise<ProductEntity[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .select(['product.*', `ts_rank(to_tsvector('english', product.name || ' ' || product.description || ' ' || product.category), plainto_tsquery(:query)) AS rank`])
      .where(
        `to_tsvector('english', product.name || ' ' || product.description || ' ' || product.category) @@ plainto_tsquery(:query)`,
        { query },
      )
      .orderBy('rank', 'DESC')
      .getRawMany();
  }

  async aiEnhancedSearch(query: string): Promise<string[]> {
    const aiSuggestions = await this.mistralService.generateProductDescription(
      `Provide search suggestions for: ${query}`,
    );
    return aiSuggestions.split('\n');
  }

  // async aiEnhancedSearch(query: string): Promise<string[]> {
  //   // Fetch all product names (or limit to top N for performance)
  //   const products = await this.productRepository.find();
  //   const productList = products.map(p => p.name).join(', ');

  //   // Compose a prompt that includes your products
  //   const prompt = `
  //     Here is a list of products: ${productList}.
  //     Based on the user's search: "${query}", suggest relevant product names from the list.
  //     Only suggest products that exist in the list.
  //   `;

  //   const aiSuggestions = await this.mistralService.generateProductDescription(prompt);
  //   return aiSuggestions.split('\n').map(s => s.trim()).filter(Boolean);
  // }




  async personalizedSearch(userId: number, query: string): Promise<ProductEntity[]> {
    // Fetch user's past orders or favorites
    const pastOrders = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.product', 'product') // Join the product table
      .where('order.createdById = :userId', { userId }) // Use the correct column name
      .getMany();
  
    const pastProducts = pastOrders.map((order) => order.product);
  
    // Perform a search and prioritize products from past orders
    const products = await this.searchProducts(query);
    const personalizedResults = products.map((product) => ({
      ...product,
      isFavorite: pastProducts.some((p) => p.id === product.id), // Check if the product is in past orders
    }))
      .sort((a, b) => (a.isFavorite ? -1 : 1)); // Prioritize favorite products
  
    return personalizedResults;
  }

  // async recommendProducts(userId: number): Promise<string[]> {
  //   const userFavorites = await this.productRepository
  //     .createQueryBuilder('product')
  //     .innerJoin('product.orders', 'order')
  //     .where('order.createdById = :userId', { userId })
  //     .getMany();
  
  //   if (userFavorites.length === 0) {
  //     return ['No favorites found for this user.'];
  //   }

  //   const favoriteDetails = userFavorites
  //     .slice(0, 5)
  //     .map((product) => `${product.name} (${product.category})`)
  //     .join(', ');
  
  //   try {
  //     const recommendations = await this.mistralService.generateProductRecommendations(
  //       `Based on these favorites: ${favoriteDetails}, recommend similar products.`,
  //     );
  //     return recommendations.split('\n');
  //   } catch (error) {
  //     console.error('Error generating recommendations:', error);
  //     throw new Error('Failed to generate product recommendations.');
  //   }
  // }

  async recommendProducts(userId: number): Promise<string[]> {
    // Fetch user's favorite products based on past orders
    const userFavorites = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.orders', 'order')
      .where('order.createdById = :userId', { userId })
      .getMany();
  
    if (userFavorites.length === 0) {
      return ['No favorites found for this user.'];
    }
  
    // Format favorite product details
    const favoriteDetails = userFavorites
      .slice(0, 5) // Limit to 5 products
      .map((product) => `${product.name} (${product.description}) (${product.description})`)
      .join(', ');
  
    try {
      
      const aiRecommendations = await this.mistralService.generateProductRecommendations(
        `Based on these favorites: ${favoriteDetails}, recommend similar products.`,
      );
  
      const aiRecommendationList = aiRecommendations.split('\n').map((rec) => rec.trim()).filter((rec) => rec);
  
      // Fetch all products from the database
      const allProducts = await this.productRepository.find();
  
      // Match AI recommendations with database products
      const matchedRecommendations = aiRecommendationList
        .map((aiRec) => {
          const matchedProduct = allProducts.find((product) =>
            aiRec.toLowerCase().includes(product.name.toLowerCase()),
          );
          return matchedProduct ? `${matchedProduct.name} (${matchedProduct.category})` : null;
        })
        .filter((rec) => rec !== null); // Remove null values
  
      if (matchedRecommendations.length === 0) {
        return ['No matching products found in the database for the recommendations.'];
      }
  
      return matchedRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate product recommendations.');
    }
  }
}