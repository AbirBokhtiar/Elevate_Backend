import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { WooCommerceService } from '../woo/woocommerce.service';
import { GeminiModule } from '../gemini/gemini.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [GeminiModule],
  controllers: [ChatController],
  providers: [ChatService, WooCommerceService],
})
export class ChatModule {}