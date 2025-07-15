import { Controller, Post, Body, ValidationPipe, UsePipes } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatQueryDto } from './dto/chat-query.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UsePipes(new ValidationPipe()) // Ensures the request body is validated against the DTO
  async handleChat(@Body() body: ChatQueryDto) {
    // The controller's job is simple: delegate all logic to the service.
    return this.chatService.processUserQuery(body.customerQuery);
  }
}