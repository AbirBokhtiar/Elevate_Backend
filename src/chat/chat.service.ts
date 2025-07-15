import { Injectable, Logger } from '@nestjs/common';
import { GeminiTool } from '../gemini/gemini.tool'; // Adjust path if needed
import { WooCommerceService } from '../woo/woocommerce.service'; // Adjust path if needed

// Define a simple interface for the product data we need
interface Product {
  name: string;
  slug: string;
  category: string;
}

// The duration to cache the product list in milliseconds (e.g., 10 minutes)
const CACHE_DURATION_MS = 5 * 60 * 1000;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private productCache: Product[] = [];
  private cacheTimestamp = 0;

  constructor(
    private readonly geminiTool: GeminiTool,
    private readonly wooCommerceService: WooCommerceService,
  ) {}

  /**
   * Main method to process a user's chat query.
   * It orchestrates fetching context, calling the AI, and formatting the response.
   */
  async processUserQuery(customerQuery: string): Promise<{ success: boolean; reply: string }> {
    this.logger.log(`Processing query: "${customerQuery}"`);
    try {
      // Step 1: Get the necessary context (products, policies)
      const productList = await this.getProductsWithCache();
      const refundPolicy = '30-day money-back guarantee on all products.';

      // Step 2: Call the AI agent with the query and context
      const aiResult = await this.geminiTool.aiAgent({
        customerQuery,
        productList,
        refundPolicy,
      });

      // Step 3: Format the potentially complex AI response into a simple string
      const replyText = this.formatAiResponse(aiResult);

      this.logger.log(`Formatted reply: "${replyText}"`);
      return { success: true, reply: replyText };

    } catch (error) {
      this.logger.error('Error processing user query', error.stack);
      return {
        success: false,
        reply: 'An internal error occurred. Our team has been notified.',
      };
    }
  }

  /**
   * Retrieves the product list, using an in-memory cache to avoid
   * excessive API calls to WooCommerce.
   */
  private async getProductsWithCache(): Promise<Product[]> {
    const now = Date.now();
    if (this.productCache.length > 0 && now - this.cacheTimestamp < CACHE_DURATION_MS) {
      this.logger.log('Returning product list from cache.');
      return this.productCache;
    }

    this.logger.log('Cache expired or empty. Fetching fresh product list from WooCommerce.');
    try {
      const rawProducts = await this.wooCommerceService.getAllProducts();
      
      // Map to the simpler Product interface
      const products = rawProducts.map((p: any) => ({
        name: p.name,
        slug: p.slug,
        category: p.categories?.[0]?.name || 'Uncategorized',
      }));

      this.productCache = products;
      this.cacheTimestamp = now;
      return products;
    } catch (error) {
        this.logger.error('Failed to fetch products from WooCommerce', error.stack);
        // If the fetch fails but we have stale cache, return it to keep the service partially working
        if (this.productCache.length > 0) {
            this.logger.warn('Returning stale cache due to fetch failure.');
            return this.productCache;
        }
        return []; // Return empty if there's no cache and fetch fails
    }
  }

  /**
   * Parses the varied response structures from the AI tool into a single, clean string.
   */
  private formatAiResponse(aiResult: any): string {
    // Case 1: The result is already a simple string
    if (typeof aiResult === 'string') {
      return aiResult;
    }
    // Case 2: The result is from a tool that returns a 'message' property (e.g., createOrder)
    if (aiResult?.reply) {
      return aiResult.reply;
    }
    // Case 3: The result is a direct response from the Gemini API
    if (aiResult?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return aiResult.response.candidates[0].content.parts[0].text;
    }
    // Fallback for unexpected structures
    this.logger.warn('Could not format AI response. Unexpected structure:', aiResult);
    return "I'm sorry, I encountered an issue processing your request. Please try rephrasing.";
  }


}