import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import z from 'zod';
import { GeminiService } from './gemini.service';
import { GenerateContentResult } from '@google/generative-ai';
import { WooCommerceService } from '../woo/woocommerce.service';
import { StripeService } from '../payments/stripe.service';
import { SSLCommerzService } from '../payments/sslcommerz.service';
import { ProductQueryParserService } from './gemini.util_service';


interface Product {
  name: string;
  slug: string;
  category: string;
}

interface GeminiSDKResponse {
  text?: () => Promise<string>;
  response?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

@Injectable()
export class GeminiTool {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly wooCommerceService: WooCommerceService,
    private readonly stripeService: StripeService,
    private readonly sslcommerzService: SSLCommerzService,
    private readonly productQueryParser: ProductQueryParserService,
  ) {}

  // Helper method to get product ID by slug
  async getProductIdBySlug(slug: string): Promise<number> {
    const products = await this.wooCommerceService.getAllProducts({ slug });
    if (Array.isArray(products) && products.length > 0) {
      return products[0].id;
    }
    throw new Error(`Product with slug "${slug}" not found.`);
  }

  // @Tool({ name: 'chat_support', description: 'AI customer support via Gemini', parameters: z.object({ customerQuery: z.string() }) })
  // async chatSupport({ customerQuery }: { customerQuery: string }) {
  //   return this.geminiService.chat(`User asks: ${customerQuery}`);
  // }

  // @Tool({ name: 'recommend_products', description: 'Recommend products', parameters: z.object({ context: z.string() }) })
  // async recommend({ context }) {
  //   return this.geminiService.chat(`Recommend products given this context: ${context}`);
  // }

  @Tool({
    name: 'Jarvis_ai_agent',
    description: 'Multi-purpose customer support agent for product info, order status, and order creation.',
    parameters: z.object({
      customerQuery: z.string(),
      productList: z.array(
        z.object({
          name: z.string(),
          slug: z.string(),
          category: z.string(),
        })
      ),
      refundPolicy: z.string(),
    }),
  })
  
  async aiAgent({
    customerQuery,
    productList,
    refundPolicy,
  }: {
    customerQuery: string;
    productList: Product[];
    refundPolicy: string;
  }) {
    // Step 1: Detect Intent using Gemini
    const intentPrompt = `
You are a customer service AI. Classify this user's query into one of the following intents:
- refund
- product_information
- order_creation
- regular_chat
- context
- order_status
- help

Customer question: "${customerQuery}"

Respond with only one word: refund, product_information, order_creation, regular_chat, context or order_status.
`;
    const intentResponse = await this.geminiService.chat(intentPrompt);
    const detectedIntent = await this.extractGeminiText(intentResponse);
    console.log('Detected Intent:', detectedIntent);

    // Step 2: Route to appropriate tool
    if (detectedIntent.includes('refund')) {
      const orderInfo = await this.tryGetOrderInfoFromQuery(customerQuery);
      return this.handleRefund({ customerQuery, refundPolicy, orderInfo });
    } else if (detectedIntent.includes('product_information')) {
      return this.aiEnhancedSearch({ query: customerQuery, productList });
    } else if (detectedIntent.includes('regular_chat')) {
      return this.chat({ customerQuery });
    } else if (detectedIntent.includes('help')) {
      return this.help({customerQuery});
    } else if (detectedIntent.includes('context')) {
      return this.context({ customerQuery });
    } else if (detectedIntent.includes('order_creation')) {
      return this.handleOrderCreation(customerQuery);
    } else if (detectedIntent.includes('order_status')) {
      // Extract email from query
      const emailMatch = customerQuery.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (!emailMatch) {
        return "For your security, please provide the email address used for this order (e.g., 'What is the status of order 123 for john@example.com?').";
      }
      const orderInfo = await this.tryGetOrderInfoFromQuery(customerQuery);
      if (orderInfo) {
        const reply = await this.formatOrderReply(orderInfo);
        return reply;
      }

      if (orderInfo?.error) {
        return "The email you provided does not match the order. Please check and try again.";
      }
      if (orderInfo) {
        return `Order ID: ${orderInfo.id}, Status: ${orderInfo.status}, Products: ${orderInfo.products.map(p => p.name).join(', ')}`;
      }
      else if (orderInfo === null) {
        return "Sorry, I couldn't retrieve your order information at this time. Please try again later.";
      }
      else {
        return `I couldn't find any order information related to your query. Please ensure you provided the correct order ID and email.`;
      }
    }else {
      return `Sorry, I couldn't understand your request. Please can you rephrase your query.`;
    }
  }


  // NEW HELPER FUNCTION to handle the entire order creation flow
  /**
   * Handles the order creation process by extracting details from the customer query.
   * If any details are missing, it prompts the user for the required information.
   */
  
  async handleOrderCreation(customerQuery: string): Promise<{ success: boolean; reply: string }> {
    try {
      const extractWithRegex = (pattern: RegExp) => {
        const match = customerQuery.match(pattern);
        return match?.[1]?.trim() || '';
      };

      let orderDetails: Record<string, string> = {
        quantity: extractWithRegex(/(?:order|buy|purchase|get)\s+(\d+)/i),
        productName: extractWithRegex(/(?:order|buy|purchase|get)\s+\d*\s*([a-zA-Z\s-]+)/i),
        customerName: extractWithRegex(/(?:my name is|I am|I'm)\s+([a-zA-Z\s]+)/i),
        customerEmail: extractWithRegex(/(?:my email is|email)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/i),
        address: extractWithRegex(/(?:address is|ship (?:it)? to|deliver to)\s+(.+?)(\.|$)/i),
      };

      // Fallbacks
      if (!orderDetails.quantity) orderDetails.quantity = '1';

      const missingFields = Object.entries(orderDetails)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      // If too many fields are missing, try semantic extraction using Gemini
      if (missingFields.length > 2) {
        const extractionPrompt = `
  Extract the following information from the customer query:
  - Product name
  - Quantity
  - Customer name
  - Customer email
  - Address

  Respond ONLY with a JSON object:
  {
    "productName": "...",
    "quantity": "...",
    "customerName": "...",
    "customerEmail": "...",
    "address": "..."
  }

  Customer Query: "${customerQuery}"
  `;

        const aiResponse = await this.geminiService.chat(extractionPrompt);
        const aiText = await this.extractGeminiText(aiResponse);

        try {
          const aiParsed = JSON.parse(aiText.replace(/`|json/gi, '').trim());
          orderDetails = {
            ...orderDetails,
            ...aiParsed,
          };
        } catch (e) {
          console.warn('Gemini extraction fallback failed:', e);
        }
      }

      // Ensure required fields
      const required = ['productName', 'quantity', 'customerName', 'customerEmail', 'address'];
      const missing = required.filter((key) => !orderDetails[key]);

      if (missing.length > 0) {
        return {
          success: false,
          reply: `📝 To place your order, I need the following information: **${missing.join(', ')}**.\n\n💡 *Example: "I want to buy 2 black t-shirts. My name is Alex, my email is alex@email.com, and my address is 123 Main St, Dhaka."*`,
        };
      }


      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderDetails.customerEmail)) {
        return {
          success: false,
          reply: '❌ Please provide a valid email address (e.g., my email is example@example.com).',
        };
      }

      // Find product
      const allProducts = await this.wooCommerceService.getAllProducts();
      const foundProduct = allProducts.find((p) =>
        p?.name?.toLowerCase().includes(orderDetails.productName.toLowerCase())
      );

      if (!foundProduct) {
        return {
          success: false,
          reply: `❌ I couldn't find any product matching "${orderDetails.productName}". Please check the name and try again.`,
        };
      }

      const order = await this.createOrder({
        productSlug: foundProduct.slug,
        quantity: Number(orderDetails.quantity),
        customerName: orderDetails.customerName,
        customerEmail: orderDetails.customerEmail,
        address: orderDetails.address,
      });

      return {
        success: true,
        reply: `✅ Order created successfully! Your order number is **${order.orderId}** and total is ৳${order.total}.`,
      };
    } catch (error) {
      console.error('Error in handleOrderCreation:', error);
      return {
        success: false,
        reply: `❌ Failed to create order: ${error.message || 'Unknown error occurred.'}`,
      };
    }
  }


  async chat({ customerQuery }: { customerQuery: string }) {
    return this.geminiService.chat(`User asks: ${customerQuery}`);
  }

  async context({ customerQuery }: { customerQuery: string }) {
    return this.geminiService.chat(`Remember what User asks: ${customerQuery} from previous conversation.Respond according to the context of previous query`);
  }

  async help({ customerQuery }: { customerQuery: string }) {
    return this.geminiService.chat(`User asks: ${customerQuery}. Respond as if you are the customer support agent for Elevate Store. Give specific instructions(step by step procedure) or information based on the query. If you don't know the answer, say "I'm not sure, but I can help you with product information, order status, or refund policies."`);
  }


  async extractGeminiText(response: any): Promise<string> {
    const candidates = response.response?.candidates;
    if (
      candidates &&
      candidates.length > 0 &&
      candidates[0].content &&
      Array.isArray(candidates[0].content.parts) &&
      candidates[0].content.parts.length > 0 &&
      typeof candidates[0].content.parts[0].text === 'string'
    ) {
      return candidates[0].content.parts[0].text.trim().toLowerCase();
    }
    return '';
  }


  async formatOrderReply(order: any): Promise<string> {
    if (!order) return "Sorry, I couldn't find that order.";

    const lineItems = Array.isArray(order.line_items) ? order.line_items : [];
    console.log('Line items:', order.line_items);

    const productLines = lineItems.map((item: any) => {
      return `- ${item.name} (৳${item.total}, Qty: ${item.quantity})`;
    }).join('\n');

    const totalAmount = order.total ? `৳${order.total}` : 'N/A';
    const status = order.status || 'N/A';
    const date = order.date_created ? new Date(order.date_created).toLocaleString() : 'N/A';
    const payment = order.payment_method_title || 'N/A';

    const result = (
      `**Order Details**\n` +
      `• Order ID: ${order.id}\n` +
      `• Status: ${status}\n` +
      `• Date: ${date}\n` +
      `• Payment Method: ${payment}\n` +
      `• Total: ${totalAmount}\n\n` +
      `**Items:**\n${productLines || 'No items found in this order.'}`
    );

    console.log('Final formatted reply:', result); 
    return result;
  }



  /**
   * Tries to extract an order ID from the user's query.
   * Returns the order object if found, otherwise null.
   */
  async tryGetOrderInfoFromQuery(query: string): Promise<any | null> {
    // Extract order ID
    const orderIdMatch = query.match(/(?:order[\s_]?id[\s:]*)?(\d{3,})/i);
    // Extract email (simple regex)
    const emailMatch = query.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (orderIdMatch) {
      const orderId = orderIdMatch[1];
      try {
        console.log('Fetching order', orderId);
        // const order = await this.wooCommerceService.getOrderById(Number(orderId));
        const order = await Promise.race([
          this.wooCommerceService.getOrderById(Number(orderId)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('WooCommerce timeout')), 8000))
        ]);
        console.log('Order fetched:', order);
        if (!order.products || !Array.isArray(order.products)) {
          order.products = [];
        }
        // If email is present in query, check it
        if (emailMatch) {
          if (order.billing?.email?.toLowerCase() === emailMatch[0].toLowerCase()) {
            return order;
          } else {
            return { error: "Email does not match order." };
          }
        }
        // If no email, return order but let caller decide what to do
        return order;
      } catch (e) {
        console.warn('Order not found:', orderId);
      }
    }
    return 'Please provide the correct order ID and email';
  }


  async handleRefund({ customerQuery, refundPolicy, orderInfo }: { customerQuery: string; refundPolicy: string; orderInfo?: any }) {
    let orderContext = '';
    if (orderInfo && orderInfo.products) {
      orderContext = `
  Order Details:
  Order ID: ${orderInfo.id}
  Products: ${orderInfo.products.map(p => `${p.name} (slug: ${p.slug})`).join(', ')}
  Order Status: ${orderInfo.status}
      `;
    } else {
      orderContext = '';
    }

    const refundPrompt = `
  You are a customer support agent for Elevate Store.

  Refund Policy:
  ${refundPolicy}

  ${orderContext}

  When answering refund questions, always provide clear, friendly, and accurate responses based on the policy and order details. Respond as if you are the seller and include only relevant precise human responses.

  Customer Question: "${customerQuery}"
  `;
    return this.geminiService.chat(refundPrompt);
  }



  async createOrderInstruction() {
    return 'Please provide the product name, quantity, your name, email, and shipping address to start the order process.';
  }

  // @Tool({
  //   name: 'create_order',
  //   description: 'Creates an order for a customer',
  //   parameters: z.object({
  //     productSlug: z.string(),
  //     quantity: z.number(),
  //     customerName: z.string(),
  //     customerEmail: z.string(),
  //     address: z.string(),
  //   }),
  // })
  async createOrder({
    productSlug,
    quantity,
    customerName,
    customerEmail,
    address,
  }: {
    productSlug: string;
    quantity: number;
    customerName: string;
    customerEmail: string;
    address: string;
  }) {

    try {
        const productId = await this.getProductIdBySlug(productSlug);

        // const wooOrder = await this.wooCommerceService.createOrder(orderData);
        const wooOrder = await this.wooCommerceService.createOrder({
          payment_method: 'bacs',
          payment_method_title: 'Cash on Delivery',
          set_paid: false,
          billing: {
            first_name: customerName || 'Guest',
            last_name: '.',
            email: customerEmail,
            address_1: address,
            city: '.',
            state: '.',
            postcode: '.',
            country: 'BD',
          },
          shipping: {
            first_name: customerName || 'Guest',
            last_name: '.',
            address_1: address,
            city: '.',
            state: '.',
            postcode: '.',
            country: 'BD',
          },
          line_items: [
            {
              product_id: productId,
              quantity: quantity || 1,
            },
          ],
        });


        if (!wooOrder || !wooOrder.id || !wooOrder.total) {
          throw new Error('Order creation failed. Invalid WooCommerce response.');
        }

        // Stripe Example:
        const clientSecret = await this.stripeService.createPaymentIntentChatbot(wooOrder);

        // For now cash on delivery is the only payment method, so we can just return the order as is
        // const clientSecret = 'mocked-client-secret'; //mock for now

        // SSLCommerz Example:
        const paymentUrl = await this.sslcommerzService.initiatePayment({
          amount: Number(wooOrder.total),
          currency: "BDT",
          transactionId: `elevate_${wooOrder.id}_${Date.now()}`,
          successUrl: "https://your-frontend.com/payment/success",
          failUrl: "https://your-frontend.com/payment/fail",
          cancelUrl: "https://your-frontend.com/payment/cancel",
          customerName,
          customerEmail,
        });

        return {
            message: `Order #${wooOrder.id} has been created successfully. Please use the following details to complete your payment.`,
            orderId: wooOrder.id,
            total: wooOrder.total,
            payment: {
                stripeClientSecret: clientSecret,
                sslcommerzUrl: paymentUrl,
            },
        };

    } catch (error) {
        console.error("Error in createOrder process:", error);
        return { message: `There was an error creating your order: ${error.message}` };
    }
  }


  // AI-powered product search with query cleaning and fallback to Gemini for vague queries
  @Tool({
    name: 'ai_enhanced_search',
    description: 'AI-powered product search suggestions',
    parameters: z.object({
      query: z.string(),
      productList: z.array(
        z.object({
          name: z.string(),
          slug: z.string(),
          category: z.string(),
        })
      ),
    }),
  })
  async aiEnhancedSearch({
    query,
    productList,
  }: {
    query: string;
    productList: Product[];
  }): Promise<string> {
    // Normalize the user query by removing filler words like "pair of", "buy", etc.
    const cleanedQuery = this.productQueryParser.normalize(query);

    // Try to find direct matches in product list based on normalized names/slugs
    const matchedProducts = productList.filter((product) => {
      const normalizedName = this.productQueryParser.normalize(product.name);
      const normalizedSlug = this.productQueryParser.normalize(product.slug);
      return (
        normalizedName.includes(cleanedQuery) ||
        normalizedSlug.includes(cleanedQuery) ||
        cleanedQuery.includes(normalizedName) ||
        cleanedQuery.includes(normalizedSlug)
      );
    });

    // If no matches found, fallback to AI for interpretation
    if (matchedProducts.length === 0) {
      const fallbackPrompt = `
You are a smart product assistant. User query: "${query}".
Here is the product list: ${productList.map(p => `${p.name} (slug: ${p.slug}, category: ${p.category})`).join(', ')}.

Suggest the top 5 relevant products by name and slug. Respond briefly with only product names and slugs.
      `;
      const fallbackResponse = await this.geminiService.chat(fallbackPrompt);
      const fallbackText = await this.extractGeminiText(fallbackResponse);
      return fallbackText || `I couldn’t find any product matching "${query}". Please try with a different query.`;
    }

    // Enrich matched products with full WooCommerce info
    const detailedProducts = await Promise.all(
      matchedProducts.map(async (product) => {
        const full = await this.wooCommerceService.getProductBySlug(product.slug);
        return {
          name: full?.name || product.name,
          price: full?.price || 'N/A',
          description: full?.short_description?.replace(/<[^>]*>?/gm, '') || 'No description available.',
          slug: full?.slug || product.slug,
          image: full?.images?.[0]?.src || '',
          stock: full?.stock_status ?? 'Unknown',
          url: `/product/${full?.slug || product.slug}`,
        };
      })
    );

    // Format product info for AI to generate a natural, human response
    const productSummary = detailedProducts
      .map(p =>
        `Product: ${p.name}\n` +
        `Price: ৳${p.price}\n` +
        `Stock: ${p.stock}\n` +
        `Description: ${p.description.slice(0, 200)}\n` +
        `Link: ${p.url}`
      )
      .join('\n\n');

    const prompt = `
Customer query: "${query}"

Matching products:
${productSummary}

Respond as a helpful AI store assistant. Explain these products politely and clearly. Answer naturally.
    `;

    const aiResponse = await this.geminiService.chat(prompt);
    const finalText = await this.extractGeminiText(aiResponse);

    return finalText || `I found some products related to "${query}" but couldn’t generate a proper response.`;
  }



  // @Tool({
  //   name: 'ai_enhanced_search',
  //   description: 'AI-powered product search suggestions',
  //   parameters: z.object({
  //     query: z.string(),
  //     productList: z.array(
  //       z.object({
  //         name: z.string(),
  //         slug: z.string(),
  //         category: z.string(),
  //       })
  //     )
  //   })
  // })
  // async aiEnhancedSearch({ query, productList }: { query: string; productList: Product[] }) {
  //   const productListString = productList
  //     .map((p: Product) => `${p.name} (slug: ${p.slug}, category: ${p.category})`)
  //     .join(", ");
  //   return this.geminiService.chat(
  //     `Here are the products: ${productListString}. Based on the search "${query}", suggest the most relevant product names (and their slugs) from the list.`
  //   );
  // }

  @Tool({
    name: 'suggest_similar_products',
    description: 'Suggest similar products from existing products',
    parameters: z.object({
      productName: z.string(),
      category: z.string(),
      productList: z.array(
        z.object({
          name: z.string(),
          slug: z.string(),
          category: z.string(),
        })
      )
    })
  })
  async suggestSimilarProducts({
    productName,
    category,
    productList,
  }: {
    productName: string;
    category: string;
    productList: Product[];
  }): Promise<{ suggestions: Product[] }> {
    const productListString = productList
      .map((p: Product) => `${p.name} (slug: ${p.slug}, category: ${p.category})`)
      .join(", ");

    let aiResponse: GenerateContentResult;
    try {
      aiResponse = await this.geminiService.chat(
        `Suggest similar products to ${productName} in category ${category}. Consider these products: ${productListString}. Respond with a JSON array of objects with 'name', 'slug', and 'category' keys. Make sure the response is a valid JSON. Example: [{"name": "Product A", "slug": "product-a", "category": "Category 1"}]. If there are no similar products, return a response saying "No similar products found". Do not respond with any random product.`,
        // `You are a product recommendation engine. Given the product: "northstar_black" in category "Footwear", and this product list: [Floral dress (slug: floral-dress, category: Dress), ...], suggest 3 similar products from the list. Respond ONLY with a JSON array of objects with 'name', 'slug', and 'category' keys. Example: [{"name": "Product A", "slug": "product-a", "category": "Category 1"}]. If there are no similar products, return an empty array.`
      );
    } catch (error) {
      console.error('Error calling Gemini service:', error);
      return { suggestions: [] };
    }

    console.log('Full Gemini response:', JSON.stringify(aiResponse, null, 2));


    // Extract text from GenerateContentResult
    let aiText = '';
    try {
      const candidates = aiResponse.response?.candidates;
      if (
        candidates &&
        candidates.length > 0 &&
        candidates[0].content &&
        Array.isArray(candidates[0].content.parts) &&
        candidates[0].content.parts.length > 0 &&
        typeof candidates[0].content.parts[0].text === 'string'
      ) {
        aiText = candidates[0].content.parts[0].text;
      }
    } catch (err) {
      console.error('Error extracting text from Gemini response:', err);
    }
    console.log('Gemini raw response:', aiText);


    let suggestions: Product[] = [];
    try {
      const parsedJson = JSON.parse(aiText);
      if (Array.isArray(parsedJson)) {
        suggestions = parsedJson.filter((item: any) =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.name === 'string' &&
          typeof item.slug === 'string' &&
          typeof item.category === 'string'
        ) as Product[];
      } else {
        console.warn('AI response was not a JSON array as expected:', aiText);
      }
    } catch (error) {
      console.error('Error parsing AI response as JSON:', error, 'AI Text:', aiText);
      suggestions = aiText
        .split("\n")
        .filter((line: string) => line.match(/^\d+\./))
        .map((line: string) => {
          const nameMatch = line.match(/^\d+\.\s*(.*?)(?:\s*:\s*.*)?$/);
          const name = nameMatch ? nameMatch[1].trim() : '';
          const slugMatch = line.match(/slug:\s*([a-zA-Z0-9-]+)/i);
          const slug = slugMatch ? slugMatch[1] : name.toLowerCase().replace(/\s+/g, "-");
          const categoryMatch = line.match(/category:\s*([a-zA-Z0-9\s-]+)/i);
          const extractedCategory = categoryMatch ? categoryMatch[1] : category;
          return { name, slug, category: extractedCategory };
        })
        .filter((p: Product) => p.name !== '');
    }

    return { suggestions };
  }
}