import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Timestamp } from "typeorm";

@Entity({ name:'token_blacklist'})
export class TokenBlackEntity {

    @PrimaryGeneratedColumn()
    id: number;
    @Column({nullable: false})
    token: string;
    @CreateDateColumn({nullable: false})
    expires_at: Timestamp;
}   

