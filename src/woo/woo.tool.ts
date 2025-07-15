import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import z from 'zod';

@Injectable()
export class WooTool {
  private wc = new WooCommerceRestApi({
    url: process.env.WC_URL as string,
    consumerKey: process.env.WC_KEY as string,
    consumerSecret: process.env.WC_SECRET as string,
  });

  @Tool({ name: 'list_products', description: 'Fetch WooCommerce products', parameters: z.object({ perPage: z.number().default(10) }) })
  async listProducts({ perPage }: { perPage: number }) {
    const res = await this.wc.get('products', { per_page: perPage });
    return res.data;
  }
}
