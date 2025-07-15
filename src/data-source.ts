import { DataSource } from 'typeorm';
import { ProductEntity } from './orders/entities/product.entity'; // add your entities here
import { OrderEntity } from './orders/entities/order.entity';
import { UserEntity } from './users/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'root',
  database: 'Elvate',
  entities: [UserEntity, OrderEntity, ProductEntity],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
