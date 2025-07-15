import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenBlackEntity } from 'src/users/entities/tokenBlack.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(TokenBlackEntity)
    private tokenBlacklistRepository: Repository<TokenBlackEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'jwt_abir', // You should keep it in env file
      passReqToCallback: true, // Enable passing the request object to the validate method
    });
  }
  async validate(req: any, payload: any) {
    // Extract the token from the request headers
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    console.log('Token from request:', token);
    // const token = ExtractJwt.fromAuthHeaderAsBearerToken()(payload);
    // console.log('Token from payload:', token);
    // Check if the token is blacklisted
    if (!token) {
      throw new BadRequestException('Token is invalid or missing');
    }

    // const blacklisted = await this.tokenBlacklistRepository.findOne({
    //   where: { token },
    // });

    return { userId: payload.sub, email: payload.email, roles: payload.roles };
  }
}
