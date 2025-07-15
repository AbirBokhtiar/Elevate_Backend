import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import dbConfig from './config/db.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MistralModule } from './mistral/mistral.module';
import { InvoiceModule } from './invoice/invoice.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SearchModule } from './search/search.module';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { WooTool } from './woo/woo.tool';
import { GeminiTool } from './gemini/gemini.tool';
import { GeminiService } from './gemini/gemini.service';
import { SSLCommerzService } from './payments/sslcommerz.service';
import { StripeService } from './payments/stripe.service';
import { WooCommerceService } from './woo/woocommerce.service';
import { ChatModule } from './chat/chat.module';
import { ChatService } from './chat/chat.service';
import { WooModule } from './woo/woo.module';
import { GeminiModule } from './gemini/gemini.module';
import { ProductQueryParserService } from './gemini/gemini.util_service';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [dbConfig],
    }),
    TypeOrmModule.forRootAsync({ useFactory: dbConfig }),
    OrdersModule,
    UsersModule,
    AuthModule,
    MistralModule,
    InvoiceModule,
    NotificationsModule,
    SearchModule,
    ChatModule,
    WooModule,
    GeminiModule,
    PaymentsModule,
    // McpModule.forRoot({
    //   name: 'woo-mcp-server',
    //   version: '1.0.0',
    //   transport: [McpTransportType.STDIO, McpTransportType.STREAMABLE_HTTP, McpTransportType.SSE], // Enable both HTTP and SSE
    // }),
    McpModule.forRoot({ 
      name: 'mcp',
      version: '1.0.0',
      transport: [McpTransportType.STDIO, McpTransportType.STREAMABLE_HTTP, McpTransportType.SSE],
    }),

  ],
  controllers: [AppController],
  providers: [AppService, WooTool, WooCommerceService, GeminiTool, GeminiService, SSLCommerzService, StripeService, ProductQueryParserService]
})
export class AppModule {}
