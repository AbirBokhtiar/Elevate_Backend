import { Global, Module } from "@nestjs/common";
import { GeminiService } from "./gemini.service";
import { GeminiTool } from "./gemini.tool";
import { WooModule } from "src/woo/woo.module";
import { StripeService } from "src/payments/stripe.service";
import { SSLCommerzService } from "src/payments/sslcommerz.service";
import { ProductQueryParserService } from "./gemini.util_service";

@Global()
@Module({
  imports: [WooModule],
  providers: [
    GeminiService,
    GeminiTool,
    StripeService,
    SSLCommerzService,
    ProductQueryParserService,
  ],
  exports: [GeminiService, GeminiTool],
})
export class GeminiModule {}
