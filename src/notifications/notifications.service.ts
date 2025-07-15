import { Injectable, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { NotificationEntity } from './entities/notifications.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: "bokhtiarbooks@gmail.com",
        pass: "qdxj xaoy vyxs jehe",
      },
    });
  }

  async createNotification(userId: number, message: string): Promise<NotificationEntity> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const notification = this.notificationRepository.create({ user, message });
    return this.notificationRepository.save(notification);
  }

  async getNotifications(userId: number): Promise<NotificationEntity[]> {
    return this.notificationRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: number): Promise<void> {
    const notification = await this.notificationRepository.findOneBy({ id: notificationId });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found`);
    }
  
    await this.notificationRepository.update(notificationId, { isRead: true });
  }

  async sendEmailNotification(to: string, subject: string, text: string): Promise<void> {
    const mailOptions = {
      from: 'bokhtiarbooks@gmail.com',
      to,
      subject: 'Notification',
      text,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error.message);
      throw new Error('Failed to send email notification');
    }
  }
}