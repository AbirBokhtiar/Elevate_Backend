import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from 'src/orders/entities/product.entity';
import { MistralModule } from 'src/mistral/mistral.module';
import { MistralService } from 'src/mistral/mistral.service';
import { MistralController } from 'src/mistral/mistral.controller';
import { OrderEntity } from 'src/orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity, OrderEntity]), MistralModule],
  providers: [SearchService, MistralService],
  controllers: [SearchController, MistralController],
})
export class SearchModule {}
