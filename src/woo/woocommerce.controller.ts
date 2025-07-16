import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { WooCommerceService } from './woocommerce.service';
import { Response } from 'express';

@Controller('woocommerce')
export class WooCommerceController {
  constructor(private readonly wooService: WooCommerceService) {}

  @Get('product/:slug')
  async getProductBySlug(@Param('slug') slug: string, @Res() res: Response) {
    try {
      const product = await this.wooService.getProductBySlug(slug);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.status(200).json(product);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch product' });
    }
  }

  @Get('reviews/:productId')
  async getReviews(@Param('productId') id: number, @Res() res: Response) {
    try {
      const url = `${this.wooService['baseUrl']}/products/${id}/reviews`;
      const request_data = { url, method: 'GET' };
      const headers = this.wooService['oauth'].toHeader(
        this.wooService['oauth'].authorize(request_data),
      );

      const axios = (await import('axios')).default;
      const result = await axios.get(url, { headers: {...headers}});
      return res.status(200).json(result.data);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  }

  @Get('similar/:category')
  async getSimilarProducts(
    @Param('category') category: string,
    @Query('exclude') excludeSlug: string,
    @Res() res: Response,
  ) {
    try {
      const axios = (await import('axios')).default;

      const catUrl = `${this.wooService['baseUrl']}/products/categories?search=${category}`;
      const catRequest = { url: catUrl, method: 'GET' };
      const catHeaders = this.wooService['oauth'].toHeader(
        this.wooService['oauth'].authorize(catRequest),
      );

      const catRes = await axios.get(catUrl, { headers: {...catHeaders} });
      const categoryId = catRes.data?.[0]?.id;
      if (!categoryId) return res.status(200).json([]);

      const prodUrl = `${this.wooService['baseUrl']}/products?category=${categoryId}`;
      const prodRequest = { url: prodUrl, method: 'GET' };
      const prodHeaders = this.wooService['oauth'].toHeader(
        this.wooService['oauth'].authorize(prodRequest),
      );
      const prodRes = await axios.get(prodUrl, { headers: {...prodHeaders} });

      const filtered = prodRes.data.filter((p: any) => p.slug !== excludeSlug).map((p: any) => ({
        name: p.name,
        slug: p.slug,
        category: p.categories?.[0]?.name || '',
      }));

      return res.status(200).json(filtered);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch similar products' });
    }
  }

  @Get('products')
  async getProducts(@Query() query: any, @Res() res: Response) {
    try {
      // Extract category slug first (if any)
      if (query.category) {
        // Resolve category slug to category ID
        const axios = (await import('axios')).default;
        const catUrl = `${this.wooService['baseUrl']}/products/categories?search=${query.category}`;
        const catRequest = { url: catUrl, method: 'GET' };
        const catHeaders = this.wooService['oauth'].toHeader(
          this.wooService['oauth'].authorize(catRequest),
        );

        const catRes = await axios.get(catUrl, { headers: { ...catHeaders } });
        const categoryId = catRes.data?.[0]?.id;
        if (!categoryId) {
          // Category slug not found → return empty array early
          return res.status(200).json([]);
        }
        // Replace category slug with ID in query for WooCommerce API
        query.category = categoryId;
      }

      // Pass all other query params as is to service
      const products = await this.wooService.getAllProducts(query);

      return res.status(200).json(products);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch products' });
    }
  }

}