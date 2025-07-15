import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal')
  price: number;

  @Column()
  description: string;

  @Column()
  size: string;

  @Column()
  color: string;

  @Column()
  category: string;

  @OneToMany(() => OrderEntity, (order) => order.product)
  orders: OrderEntity[];
}