import { Module } from '@nestjs/common';
import { MistralService } from './mistral.service';
import { MistralController } from './mistral.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../orders/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [MistralController],
  providers: [MistralService],
})
export class MistralModule {}