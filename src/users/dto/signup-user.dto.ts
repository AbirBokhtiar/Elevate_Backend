import { IsEmail, IsEmpty, IsNotEmpty, IsString } from "class-validator";
import { signinUserDto } from "./signin-user.dto";

export class signupUserDto extends signinUserDto{

    @IsNotEmpty({message: 'Name should not be empty'})
    @IsString({message: 'Name should be a string'})
    name: string

}