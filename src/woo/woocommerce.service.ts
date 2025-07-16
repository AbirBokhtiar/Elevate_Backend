import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as OAuth from 'oauth-1.0a';
import * as crypto from 'crypto';
import { set } from 'zod';

@Injectable()
export class WooCommerceService {
  private readonly baseUrl = 'https://elevateyourway.infinityfreeapp.com/wp-json/wc/v3';

  private consumerKey = process.env.WC_KEY as string;
  private consumerSecret = process.env.WC_SECRET as string;

  private oauth = new OAuth({
    consumer: {
      key: this.consumerKey,
      secret: this.consumerSecret,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64');
    },
  });

  /**
   * Creates a new order using OAuth 1.0a (recommended for production)
   */
  async createOrder(orderData: any) {
    try {
      const url = `${this.baseUrl}/orders`;
      const request_data = { url, method: 'POST' };

      const headers = {
        ...this.oauth.toHeader(this.oauth.authorize(request_data)),
        'Content-Type': 'application/json',
      };

      const response = await axios.post(url, orderData, { headers });
      return response.data;
    } catch (error) {
      console.error('Order creation error:');
      if (axios.isAxiosError(error)) {
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
      } else {
        console.error('Unexpected error:', error.message);
      }
      throw new Error('Order creation failed. Check server logs.');
    }
  }

  /**
   * Fetches all products with optional filters (slug, category, etc.)
   */
  async getAllProducts(params: Record<string, any> = {}) {
    const url = `${this.baseUrl}/products`;
    const request_data = { url, method: 'GET', data: params };
    const headers = {
      ...this.oauth.toHeader(this.oauth.authorize(request_data)),
    };

    try {
      const res = await axios.get(url, { headers, params });
      return res.data;
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      throw new Error('Failed to fetch products from WooCommerce.');
    }
  }

  /**
   * Gets the WooCommerce product ID from a given slug
   */
  async getProductIdBySlug(slug: string): Promise<number> {
    const products = await this.getAllProducts({ slug });
    if (Array.isArray(products) && products.length > 0) {
      return products[0].id;
    }
    throw new Error(`Product with slug "${slug}" not found.`);
  }


  //Retrieves user;s specific product information by slug
  
  async getProductBySlug(slug: string): Promise<any> {

    const url = `${this.baseUrl}/products?slug=${slug}`;
    const request_data = { url, method: 'GET' };

    const headers = {
      ...this.oauth.toHeader(this.oauth.authorize(request_data)),
      'Content-Type': 'application/json',
    };

    const res = await axios.get(url, { headers });
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data[0];
    }
    return null;
  }

  /**
   * Retrieves a specific order by ID using OAuth
   */
  async getOrderById(orderId: number) {
    const url = `${this.baseUrl}/orders/${orderId}`;
    const request_data = { url, method: 'GET' };
    const headers = {
      ...this.oauth.toHeader(this.oauth.authorize(request_data)),
    };

    try {
      const res = await axios.get(url, { headers });
      return res.data;
    } catch (error) {
      console.error('Error fetching order:', error.response?.data || error.message);
      throw new Error(`Order with ID ${orderId} not found.`);
    }
  }

  //update order status after payment

  async updateOrderStatus(orderId: number, data: {set_paid: boolean, status: string}) {
    if(data.set_paid === true && data.status === 'processing') {
      const url = `${this.baseUrl}/orders/${orderId}`;
      const request_data = { url, method: 'PUT', data: { status } };
      const headers = {
        ...this.oauth.toHeader(this.oauth.authorize(request_data)),
        'Content-Type': 'application/json',
      };

      try {
        const res = await axios.put(url, { status }, { headers });
        return res.data;
      } catch (error) {
        console.error('Error updating order status:', error.response?.data || error.message);
        throw new Error('Failed to update order status.');
      }
    }
  }

}
