import { IsEmail, IsEmpty, IsNotEmpty, IsString } from "class-validator";

export class signinUserDto {

    @IsNotEmpty({message: 'Email should not be empty'})
    @IsEmail({}, {message: 'Email should be a valid email'})
    email: string;

    @IsNotEmpty({message: 'Password should not be empty'})
    password: string;
}