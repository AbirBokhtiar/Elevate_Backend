import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
@Injectable()
export class GeminiService {
  private client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  async chat(prompt: string) {
    const model = this.client.getGenerativeModel({ model: process.env.GEMINI_MODEL as string });
    const resp = await model.generateContent(prompt);
    return resp;
  }
}
