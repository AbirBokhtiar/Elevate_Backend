// payments.module.ts
import { Module } from '@nestjs/common';
import { BkashService } from './bkash.service';
import { PaymentsController } from './payments.controller';
import { WooCommerceService } from 'src/woo/woocommerce.service';
import { StripeService } from './stripe.service';
import { SSLCommerzService } from './sslcommerz.service';

@Module({
  providers: [BkashService, WooCommerceService, StripeService, SSLCommerzService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
