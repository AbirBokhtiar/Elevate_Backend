import { Module } from '@nestjs/common';
import { WooCommerceService } from './woocommerce.service';
import {StripeService} from '../payments/stripe.service';
import { SSLCommerzService } from '../payments/sslcommerz.service';
import { WooCommerceController } from './woocommerce.controller';

@Module({
  providers: [WooCommerceService, StripeService, SSLCommerzService],
  controllers: [WooCommerceController],
  exports: [WooCommerceService, StripeService, SSLCommerzService],
})
export class WooModule {}
