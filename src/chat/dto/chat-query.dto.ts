import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ChatQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000) // Good practice to prevent overly long inputs
  customerQuery: string;
}