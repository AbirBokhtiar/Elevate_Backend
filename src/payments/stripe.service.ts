// stripe.service.ts
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-06-30.basil',
  });

async createPaymentIntent(order: any) {
  return await this.stripe.paymentIntents.create({
    amount: Number(order.total) * 100, // Stripe uses smallest currency unit
    currency: 'bdt',
    metadata: { order_id: order.id },
  });
}
async createPaymentIntentChatbot(order: any) {
  const paymentIntent = await this.stripe.paymentIntents.create({
    amount: Number(order.total) * 100, // Stripe uses cents
    currency: 'bdt',
    metadata: {
      order_id: order.id,
    },
  });
  return paymentIntent.client_secret;
}


  async handleWebhook(payload: Buffer, sig: string, endpointSecret: string) {
    const event = this.stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    return event;
  }
}
