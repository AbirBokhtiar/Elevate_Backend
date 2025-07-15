// bkash.service.ts
import { Injectable } from '@nestjs/common';
import { BkashGateway } from 'bkash-payment-gateway';
import * as Bkash from 'bkash-payment-gateway';
import axios from 'axios';

@Injectable()
export class BkashService {
  private baseURL = 'https://checkout.sandbox.bka.sh/v1.2.0-beta';
  private credentials = {
    key: process.env.BKASH_APP_KEY,
    username: process.env.BKASH_USERNAME,
    password: process.env.BKASH_PASSWORD,
    secret: process.env.BKASH_APP_SECRET,
  };

  private async getAccessToken(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseURL}/checkout/token/grant`,
        {
          app_key: this.credentials.key,
          app_secret: this.credentials.secret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            username: this.credentials.username,
            password: this.credentials.password,
          },
        },
      );
      console.log('Access token response:', response.data);
      return response.data.id_token;
    } catch (error) {
      console.error('Failed to get access token:', error.response?.data || error.message);
      throw new Error('Unable to obtain bKash access token');
    }
  }

  async createPayment(order: any): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        `${this.baseURL}/checkout/payment/create`,
        {
          amount: order.total,
          currency: 'BDT',
          merchantInvoiceNumber: `ORDER-${order.id}`,
          intent: 'sale',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-APP-Key': this.credentials.key,
          },
        },
      );
      console.log('bKash create payment response:', response.data);
      return {
        paymentID: response.data.paymentID,
        redirectURL: response.data.bkashURL,
      };
    } catch (error) {
      console.error('bKash create payment error:', error.response?.data || error.message);
      throw error;
    }
  }

//   async createPayment(order: any): Promise<any> {
//     const result = await this.bkash.createPayment({
//       amount: order.total,
//       orderID: `ORDER-${order.id}`,
//       intent: 'sale',
//     });
//     console.log('Bkash Payment Response:', result);
//     return {
//       paymentID: result.paymentID,
//     //   redirectURL: result.bkashURL,
//     };
//   }

//   async executePayment(paymentID: string): Promise<any> {
//     const result = await this.bkash.executePayment(paymentID);
//     return result;
//   }
async executePayment(paymentID: string): Promise<any> {
    try {
        const token = await this.getAccessToken();
        const response = await axios.post(
        `${this.baseURL}/checkout/payment/execute/${paymentID}`,
        {},
        {
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-APP-Key': this.credentials.key,
            },
        },
        );
        return response.data;
    } catch (error) {
        console.error('bKash execute payment error:', error.response?.data || error.message);
        throw error;
    }
}

//   async queryPayment(paymentID: string): Promise<any> {
//     return this.bkash.queryPayment(paymentID);
//   }

//   async searchTransaction(trxID: string): Promise<any> {
//     return this.bkash.searchTransaction(trxID);
//   }

//   async refundTransaction(data: {
//     paymentID: string;
//     amount: string;
//     trxID: string;
//     sku: string;
//   }): Promise<any> {
//     return this.bkash.refundTransaction(data);
//   }

//   async refundStatus(trxID: string, paymentID: string): Promise<any> {
//     return this.bkash.refundStatus(trxID, paymentID);
//   }
}
