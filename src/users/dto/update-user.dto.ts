import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    id: number;
    email: string;
    name: string;
    address: string;
    phone: string;
}
