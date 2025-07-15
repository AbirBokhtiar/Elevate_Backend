import { Controller, Get, Post, Body, Patch, Param, Delete, ValidationPipe, UsePipes, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Request } from 'express';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getInitMessage(){
    return 'Welcome to the Orders API!';
  }

  @Roles('user', 'admin')
  @Post('createOrder')
  create(@Body() createOrderDto: CreateOrderDto, @Req() request: Request) {
    const user = request.user; // ← From token
    console.log('Current user', user);
    return this.ordersService.create(createOrderDto, user);
  }

  @Roles('admin')
  @Get('findAllOrders')
  findAll() {
    return this.ordersService.findAll();
  }

  @Roles('admin')
  @Get('findOrder/:id')
  findOne(@Param('id') id: number) {
    return this.ordersService.findOne(id);
  }

  @Roles('admin')
  @Patch('updateOrder/:id')
  update(@Param('id') id: number, @Body() data: UpdateOrderDto) {
    return this.ordersService.update(id, data);
  }

  @Roles('admin')
  @Delete('deleteOrder/:id')
  remove(@Param('id') id: number) {
    return this.ordersService.remove(id);
  }
}
