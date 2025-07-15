import { Body, Controller, Post } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { SSLCommerzService } from "./sslcommerz.service";
import { WooCommerceService } from "src/woo/woocommerce.service";
import { BkashService } from "./bkash.service";

@Controller('payments')
export class PaymentsController{
    constructor(
        private stripeService: StripeService, 
        private sslService: SSLCommerzService,
        private wooCommerce: WooCommerceService,
        private bkashService: BkashService,
    ) {}

    @Post('stripe-intent')
    async createStripeIntent(@Body() body: { orderId: number }) {
    const order = await this.wooCommerce.getOrderById(body.orderId);
    const intent = await this.stripeService.createPaymentIntent(order);
    return { clientSecret: intent.client_secret };
    }

    // POST /payments/sslcommerz-initiate
    @Post('sslcommerz-initiate')
    async initSSL(@Body() body: { orderId: number }) {
    const order = await this.wooCommerce.getOrderById(body.orderId);
    const url = await this.sslService.initiatePayment(order);
    return { gatewayUrl: url };
    }


    @Post('bkash-initiate')
    async initiateBkash(@Body() body: { orderId: number }) {
        const order = await this.wooCommerce.getOrderById(body.orderId);
        const result = await this.bkashService.createPayment(order);
        return {
            paymentID: result.paymentID,
        };
    }

    @Post('bkash-execute')
    async executeBkash(@Body() body: { paymentID: string, orderId: number }): Promise<any> {
        const result = await this.bkashService.executePayment(body.paymentID);

        if (result.transactionStatus === 'Completed') {
            await this.wooCommerce.updateOrderStatus(body.orderId, {
                set_paid: true,
                status: 'processing',
            });
        }
        return result;
    }
}
