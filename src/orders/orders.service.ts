import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { ShippingEntity } from './entities/shipping.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ProductEntity } from './entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private orderRepository: Repository<OrderEntity>,

    @InjectRepository(ShippingEntity)
    private shippingRepository: Repository<ShippingEntity>,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(ProductEntity)
    private productRepository: Repository<ProductEntity>
  ) {}

  // async create(data: CreateOrderDto) {
  //   const orderCreated = await this.orderRepository.save(data);
  //   return{
  //     message: 'Order has been created successfully',
  //     order: orderCreated,
  //   }
  // }
  
  
  async create(data: CreateOrderDto, user: Express.User | undefined) {
    if (data.id) {
      const existingOrder = await this.orderRepository.findOneBy({ id: data.id });
      if (existingOrder) {
        throw new Error(`Order with sID ${data.id} already exists`);
      }
    }

    const product = await this.productRepository.findOneBy({ id: data.product.id });
    if (!product) {
      throw new NotFoundException(`Product with ID ${data.product.id} does not exist`);
    }

    const order = this.orderRepository.create({ ...data, product });
    const orderCreated = await this.orderRepository.save(order);

    return {
      message: 'Order has been created successfully',
      order: orderCreated,
    };
  }

  async findAll() {
      return await this.orderRepository.find({
        relations: ['createdBy', 'updatedBy', 'shippingAddress', 'product'],
      });
  }

  async findOne(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy', 'shippingAddress', 'product'], 
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  // async update(id: number, data: UpdateOrderDto) {
  //   const order = await this.orderRepository.findOneBy({ id });
  
  //   if (!order) {
  //     throw new NotFoundException(`Order with ID ${id} not found`);
  //   }
  
  //   const d = Object.assign(order, data);
  //   await this.orderRepository.save(d);
  //   return {
  //     message: `Order with ID ${id} has been updated successfully`,
  //     order: d,
  //   };
  // }

  async update(id: number, data: UpdateOrderDto) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy', 'shippingAddress', 'product'], 
    });
  
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  
    // Validate createdBy
    if (data.createdBy?.id) {
      const createdByUser = await this.userRepository.findOneBy({ id: data.createdBy.id });
      if (!createdByUser) {
        throw new NotFoundException(`User with ID ${data.createdBy.id} does not exist`);
      }
    }
  
    // Validate updatedBy
    if (data.updatedBy?.id) {
      const updatedByUser = await this.userRepository.findOneBy({ id: data.updatedBy.id });
      if (!updatedByUser) {
        throw new NotFoundException(`User with ID ${data.updatedBy.id} does not exist`);
      }
    }

    // Validate product
    if (data.product) {
      const product = await this.productRepository.findOneBy({ id: data.product.id });
      if (!product) {
        throw new NotFoundException(`Product with ID ${data.product} does not exist`);
      }
    }
  
    // Update the order
    const updatedOrder = Object.assign(order, data);
    await this.orderRepository.save(updatedOrder);
  
    return {
      message: `Order with ID ${id} has been updated successfully`,
      order: updatedOrder,
    };
  }
  

  async remove(id: number) {
      const order = await this.orderRepository.findOne({
        where: { id },
        relations: ['shippingAddress', 'product'],
      });
    
      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
    
      // Remove the associated shipping address
      if (order.shippingAddress) {
        await this.shippingRepository.remove(order.shippingAddress);
      }
    
      // Remove the order
      await this.orderRepository.remove(order);
    
      return { message: `Order with ID ${id} has been removed successfully` };
    }
}
