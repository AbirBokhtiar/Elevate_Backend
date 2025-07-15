import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { ProductEntity } from 'src/orders/entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MistralService {
  constructor(
    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>
  ) {}

  private readonly API_URL = 'https://api.together.xyz/v1/chat/completions';
  private readonly API_KEY = 'ca8e5d1d7c29e67a271014dc80470270a4eff25f186c4c100237a3ad96dc9516';


  async generateProductDescription(productDetails: string): Promise<string> {
    try {
      const response = await axios.post(
        this.API_URL,
        {
          model: 'mistralai/Mistral-7B-Instruct-v0.2',
          messages: [
            {
              role: 'system',
              content: 'You are a creative fashion product description generator for an ecommerce platform.',
            },
            {
              role: 'user',
              content: `Write a stylish and attractive product description for this item: ${productDetails}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        },
        {
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const generatedText = response.data.choices[0].message.content;
      return generatedText.trim();
    } catch (error) {
      console.error('🔥 Error from TogetherAI:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to generate product description');
    }
  }
  

  async generateProductDescriptionByProduct(product: ProductEntity): Promise<string> {
    try {
      const productDetails = `
      Name: ${product.name}
      Price: $${product.price}
      Description: ${product.description}
      Size: ${product.size}
      Color: ${product.color}
      Category: ${product.category}
    `;

      return await this.generateProductDescription(productDetails);
    } catch (error) {
      console.error('🔥 Error from TogetherAI:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to generate product description');
    }
  }

  async generateProductDescriptionById(productId: number): Promise<string> {
    try {
      // Fetch the product from the database using the productId
      const product = await this.productRepository.findOneBy({ id: productId });
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }

      return await this.generateProductDescriptionByProduct(product);
    } catch (error) {
      console.error('🔥 Error from TogetherAI:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to generate product description');
    }
  }

  async generateProductRecommendations(productDetails: string): Promise<string> {
    try {
      const response = await axios.post(
        this.API_URL,
        {
          model: 'mistralai/Mistral-7B-Instruct-v0.2',
          messages: [
            {
              role: 'system',
              content: 'You are a creative fashion product recommendation generator for an ecommerce platform.',
            },
            {
              role: 'user',
              content: `Write a list of similar products based on the product description: ${productDetails}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        },
        {
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const generatedText = response.data.choices[0].message.content;
      return generatedText.trim();
    } catch (error) {
      console.error('🔥 Error from TogetherAI:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to generate product description');
    }
  }
}
