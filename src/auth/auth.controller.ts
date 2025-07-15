import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    // In real app, you must validate user credentials!
    const { username, password } = body;
    return this.authService.login({ username }, password);
  }

//   @Post('login')
//   async login(@Body() body: { username: string; password: string }, @Res() res: Response) {
//     const { username, password } = body;
//     const { access_token } = await this.authService.login(username, password);
//     res.cookie('jwt', access_token, { httpOnly: true, secure: true });
//     res.json({ message: 'Login successful' });
//   }

//   @Post('logout')
//   async logout(@Res() res: Response) {
//     res.clearCookie('jwt');
//     res.json({ message: 'Logged out successfully' });
//   }
}
