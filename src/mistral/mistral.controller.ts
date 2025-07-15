import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductEntity } from '../orders/entities/product.entity';
import { Repository } from 'typeorm';
import { MistralService } from './mistral.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mistral')
export class MistralController {
  constructor(private readonly mistralService: MistralService) {}

  // @Roles('admin')
  @Post('generate-description')
  async generateDescription(@Body('productDetails') productDetails: string) {
    const description = await this.mistralService.generateProductDescription(productDetails);
    return { description };
  }

  @Roles('admin')
  @Post('generate-descriptionByProduct/:productId')
  async generateProductDescriptionById(@Param('productId') productId: number) {
    const product = await this.mistralService.generateProductDescriptionById(productId);
    return { product };
  }
}