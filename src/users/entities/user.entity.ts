import { NotificationEntity } from "src/notifications/entities/notifications.entity";
import { OrderEntity } from "src/orders/entities/order.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, NumericType, OneToMany, PrimaryGeneratedColumn, Timestamp, UpdateDateColumn } from "typeorm";
import { Roles } from "../enums/user-roles.enum";

@Entity({ name:'users'})
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({unique: true})
    email: string;

    @Column({select: false})
    password: string;

    @Column({nullable: true})
    address: string;

    @Column({nullable: true})
    phone: string;

    @CreateDateColumn({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Timestamp;

    @UpdateDateColumn({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    updatedAt: Timestamp;

    @Column({type: 'enum', enum: Roles, array: true, default: [Roles.USER]})
    roles: Roles[];

    @OneToMany(() => NotificationEntity, (notification) => notification.user)
    notifications: NotificationEntity[];

    @OneToMany(() => OrderEntity, (order) => order.createdBy)
    ordersCreatedBy: OrderEntity[];

    @OneToMany(() => OrderEntity, (order) => order.updatedBy)
    ordersUpdatedBy: OrderEntity[];
}
