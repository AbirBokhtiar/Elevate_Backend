import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            pool: true,
            host: process.env.MAIL_HOST,
            port: Number(process.env.MAIL_PORT),
            secure: true, // or true if using port 465
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
            },
            tls: {
                servername: 'smtp.gmail.com',
                rejectUnauthorized: false, // <--- Add this line
            },
        });
  }

    async sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: process.env.MAIL_FROM || '"Elevate Team" <no-reply@elevate.com>', // Replace with your sender email
                to,
                subject,
                text,
                html,
            });

            console.log('Mail sent successfully to the provided email address');

        } catch (error) {
            console.error('Error sending mail:', error);
            throw new Error('Failed to send mail');
        }
    }

}