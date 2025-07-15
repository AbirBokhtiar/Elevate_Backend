import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEntity } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerService } from 'src/mailer/mailer.service';
import { JwtModule } from '@nestjs/jwt';
import { TokenBlackEntity } from './entities/tokenBlack.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, TokenBlackEntity]),
    JwtModule.register({
      secret: 'jwt_abir', // Use a secure secret key (store in .env for production)
      signOptions: { expiresIn: '1h' }, // Token expiration time
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, MailerService],
})
export class UsersModule {}
