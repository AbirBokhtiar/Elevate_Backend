import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { signupUserDto } from './dto/signup-user.dto';
import { hash, compare, hashSync } from 'bcrypt';
import { MailerService } from 'src/mailer/mailer.service';
import { signinUserDto } from './dto/signin-user.dto';
import { JwtService } from '@nestjs/jwt';
import { TokenBlackEntity } from './entities/tokenBlack.entity';
import * as otpGenerator from 'otp-generator';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository <UserEntity>,
    private mailerService: MailerService,
    private jwtService: JwtService,
    @InjectRepository(TokenBlackEntity)
    private tokenBlacklistRepository: Repository<TokenBlackEntity>, 
  ){}

  //signup
  async signup(usersignUpdto: signupUserDto): Promise<{ user: UserEntity, otpToken: string }> {
    const existingUser = await this.userRepository.findOneBy({ email: usersignUpdto.email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await hash(usersignUpdto.password, 10);
    usersignUpdto.password = hashedPassword;

    let user = this.userRepository.create(usersignUpdto);
    user = await this.userRepository.save(user);
    user.password = '';

    // Generate OTP
    const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

    await this.mailerService.sendMail(
      user.email,
      'Welcome to Elevate!',
      //`Hello ${user.name},\n\nWelcome to Elevate! We're excited to have you on board.`,
      `<h1>Hello ${user.name},</h1><p>Welcome to <strong>Elevate</strong>! We're excited to have you on board.</p>`,
      `<p>Your OTP for verification is: <strong>${otp}</strong></p>`
    );

    // save the otp using jwt token
    const payload = { email: user.email, otp };
    const otpToken = this.jwtService.sign(payload, { expiresIn: '5m' }); 
    await this.tokenBlacklistRepository.save({ token: otpToken });

    return { otpToken, user };

  }


  //otp resend
  async resendOtp(email: string): Promise<{ otpToken: string }> {
    // Generate OTP
    const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

    await this.mailerService.sendMail(
      email,
      'Elevate - OTP Resend',
      `<h1>Hello,</h1><p>Welcome to <strong>Elevate</strong>! We're excited to have you on board.</p>`,
      `<p>Your OTP for verification is: <strong>${otp}</strong></p>`
    );

    // save the otp using jwt token
    const payload = { email:email, otp };
    const otpTokenResend = this.jwtService.sign(payload, { expiresIn: '5m' });
    await this.tokenBlacklistRepository.save({ token: otpTokenResend });

    return { otpToken: otpTokenResend };
  }


  //otp verification
  async otpVerify(otpToken: string, userOtp: string): Promise<{ otp: string }> {

    try {
      const payload = this.jwtService.verify(otpToken);

      const blacklistedToken = await this.tokenBlacklistRepository.findOne({
        where: { token: otpToken },
      });

      if (!blacklistedToken) {
        throw new Error('Token not found in blacklist');
      }

      if (payload.otp !== userOtp) {
        throw new BadRequestException('Incorrect OTP');
      }

      await this.tokenBlacklistRepository.remove(blacklistedToken);
      this.mailSignupSuccess(payload);

      // Optionally, you can create the user here if not already created
      // const user = await this.userRepository.findOneBy({ email: payload.email });
      // if (!user) {
      //   const newUser = this.userRepository.create({ email: payload.email, name: payload.name });
      //   await this.userRepository.save(newUser);
      // }

      return payload.email;

    } catch (error) {
      throw new BadRequestException('Invalid or expired OTP token');
    }
  }
    

  mailSignupSuccess(usersignUpdto: signupUserDto): string {
    this.mailerService.sendMail(
      usersignUpdto.email,
      'Welcome to Elevate!',
      `<h1>Hello ${usersignUpdto.name},</h1><p>Thank you for signing up with Elevate! We're excited to have you on board.</p>`,
      `<p>Your account has been successfully created. You can now log in and start using our services.</p>`
    );
    return `User ${usersignUpdto.name} signed up successfully`;
  }


  //signin
  async signin(usersignindto: signinUserDto): Promise<{ user: UserEntity; accessToken: string }> {
    const user = await this.userRepository.createQueryBuilder('users')
      .addSelect('users.password')
      .where('users.email = :email', { email: usersignindto.email })
      .getOne();
    if (!user) {
      throw new BadRequestException('User not found');
    }

    console.log('Password from DTO:', usersignindto.password); // Debug log
    console.log('Password from DB:', user.password); // Debug log

    
    const passwordMatch = await compare(usersignindto.password, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('Invalid password');
    }

    const payload = { email: user.email, sub: user.id, roles: user.roles };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    
    const tokenBlacklistEntry = this.tokenBlacklistRepository.create({
      token: accessToken,
      expires_at: new Date(Date.now() + 3600 * 1000), // 1 hour expiration
    });
    await this.tokenBlacklistRepository.save(tokenBlacklistEntry);

    user.password = ''; 

    return { accessToken, user };
  }


  //signout
  async signout(token: string): Promise<string> {
    const decoded = this.jwtService.decode(token) as any;

    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token');
    }

    // const expiresAt = new Date(decoded.exp * 1000);

    // take the token off from the blacklist
    const blacklistedToken = await this.tokenBlacklistRepository.findOne({
      where: { token },
    });
    if (!blacklistedToken) {
      throw new Error('Token not found in blacklist');
    }
    await this.tokenBlacklistRepository.remove(blacklistedToken);

    // await this.tokenBlacklistRepository.save({
    //   token,
    //   expiresAt,
    // });

    return 'Successfully signed out';
  }


  //userinfo edit
  async updateUserInfo(updateUserDto: UpdateUserDto): Promise<UserEntity> {
    // Assume updateUserDto contains the user's id and fields to update
    const { ...updateFields } = updateUserDto;
    const user = await this.userRepository.findOneBy({ id: updateFields.id });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update the user fields
    delete updateFields.password;
    Object.assign(user, updateFields);

    console.log('Updating user:', user);

    return await this.userRepository.save(user);
  }


  //password change
  async updatePassword(id: number, currentPassword: string, newPassword: string): Promise<UserEntity> {
    const user = await this.userRepository.createQueryBuilder('users')
      .addSelect('users.password')
      .where('users.id = :id', { id })
      .getOne();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!currentPassword || !user.password) {
      throw new BadRequestException('Current password or user password is missing');
    }

    const passwordMatch = await compare(currentPassword, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('Invalid current password');
    }

    user.password = await hash(newPassword, 10);
    return await this.userRepository.save(user);
  }


  //Forgot password
  async forgotPassword(email: string): Promise<string> {
    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });

    await this.mailerService.sendMail(
      user.email,
      'Elevate - Password Reset OTP',
      `Hello ${user.name}, Your OTP for password reset is: ${otp}`,  // plain text
    );


    // save the otp using jwt token
    const payload = { email: user.email, otp };
    const otpToken = this.jwtService.sign(payload, { expiresIn: '5m' }); 
    await this.tokenBlacklistRepository.save({ token: otpToken });

    return otpToken;
  }


  //reset password
  async resetPassword(email: string, newPassword: string): Promise <string> {

    const user = await this.userRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.password = await hash(newPassword, 10);
    await this.userRepository.save(user);

    return "Password reset successfully";
  }



  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

}
