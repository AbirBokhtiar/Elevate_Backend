import { Module } from '@nestjs/common';
import { WooCommerceService } from './woocommerce.service';
import {StripeService} from '../payments/stripe.service';
import { SSLCommerzService } from '../payments/sslcommerz.service';

@Module({
  providers: [WooCommerceService, StripeService, SSLCommerzService],
  exports: [WooCommerceService, StripeService, SSLCommerzService],
})
export class WooModule {}
