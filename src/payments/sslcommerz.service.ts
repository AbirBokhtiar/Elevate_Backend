import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SSLCommerzService {
  private readonly storeId = process.env.SSLCOMMERZ_STORE_ID;
  private readonly storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  private readonly initUrl =
    process.env.SSLCOMMERZ_MODE === 'live'
      ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
      : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

  async initiatePayment({
    amount,
    currency,
    transactionId,
    successUrl,
    failUrl,
    cancelUrl,
    customerName,
    customerEmail,
  }: {
    amount: number;
    currency: string;
    transactionId: string;
    successUrl: string;
    failUrl: string;
    cancelUrl: string;
    customerName: string;
    customerEmail: string;
  }) {
    const payload = {
      store_id: this.storeId,
      store_passwd: this.storePassword,
      total_amount: amount,
      currency,
      tran_id: transactionId,
      success_url: successUrl,
      fail_url: failUrl,
      cancel_url: cancelUrl,
      cus_name: customerName,
      cus_email: customerEmail,
      cus_add1: 'Dhaka',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: 'eCommerce Order',
      product_category: 'General',
      product_profile: 'general',
    };

    try {
      const response = await axios.post(this.initUrl, payload);
      return response.data.GatewayPageURL; // Redirect user to this URL
    } catch (error) {
      console.error('SSLCommerz Error:', error.response?.data || error.message);
      throw new Error('Payment initiation with SSLCommerz failed.');
    }
  }
}
