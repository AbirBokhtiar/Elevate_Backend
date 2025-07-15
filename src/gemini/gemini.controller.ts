import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '../orders/entities/product.entity';
import { Repository } from 'typeorm';
import { GeminiService } from './gemini.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Tool } from '@rekog/mcp-nest';
import z from 'zod';

// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Tool({ name: 'chat_support', description: 'AI customer support via Gemini', parameters: z.object({ customerQuery: z.string() }) })
    async chatSupport({ customerQuery }) {
    return this.geminiService.chat(`User asks: ${customerQuery}`);
    }

    @Tool({ name: 'recommend_products', description: 'Recommend products', parameters: z.object({ context: z.string() }) })
    async recommend({ context }) {
        return this.geminiService.chat(`Recommend products given this context: ${context}`);
    }


    // @Post('chat-support')
    // async chatSupportHttp(@Body() body: { customerQuery: string }) {
    //     return this.geminiService.chat(`User asks: ${body.customerQuery}`);
    // }

    // @Post('recommend-products')
    // async recommendHttp(@Body() body: { context: string }) {
    //     return this.geminiService.chat(`Recommend products given this context: ${body.context}`);
    // }
}