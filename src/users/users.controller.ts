import { Controller, Get, Post, Body, Patch, Param, Delete, Inject, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { signupUserDto } from './dto/signup-user.dto';
import { signinUserDto } from './dto/signin-user.dto';
import { Roles } from 'src/auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  
  @Post('signup')
  async signup(@Body() usersignUp: signupUserDto): Promise<{user: UserEntity; otpToken: string; }> {
    return await this.usersService.signup(usersignUp);
  }

  @Post('otpResend')
  async resendOtp(@Body() body: { email: string }): Promise<{ otpToken: string; }>  {
    return await this.usersService.resendOtp(body.email);
  }

  @Post('otpVerify')
  async verifyOtp(@Body() body: { otp: string }, @Req() req) {
    const token = req.headers.authorization?.split(' ')[1];
    const email = await this.usersService.otpVerify(token, body.otp);
    return { message: 'OTP verified', email };
}

  @Post('signin')
  async signin(@Body() usersignin: signinUserDto): Promise<{ user: UserEntity; accessToken: string; }> {
    return await this.usersService.signin(usersignin);
  }


  @Post('editInfo')
  updateUserInfo(@Body() updateUserDto: UpdateUserDto): Promise<UserEntity> {
    return this.usersService.updateUserInfo(updateUserDto);
  }


  // @UseGuards(JwtAuthGuard)
  @Post('updatePass')
  async updatePassword(@Body() dto: UpdatePasswordDto): Promise<UserEntity> {
    return this.usersService.updatePassword(dto.id, dto.currentPassword, dto.newPassword);
  }


  @Post('forgotPassword')
  async forgotPassword(@Body() body: {email: string}): Promise<string> {
    return this.usersService.forgotPassword(body.email);
  }


  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; newPassword: string }) {
    return await this.usersService.resetPassword(body.email, body.newPassword);
  }


  @Post('signout')
  async signout(@Req() req): Promise<string> {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('Token is required');
    }

    return await this.usersService.signout(token);
  }
  

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
