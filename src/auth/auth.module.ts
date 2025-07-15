import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenBlackEntity } from 'src/users/entities/tokenBlack.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenBlackEntity]),
    PassportModule,
    JwtModule.register({
      secret: 'jwt_abir',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
