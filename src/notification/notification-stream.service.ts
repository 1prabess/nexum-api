import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { NotificationResponseDto } from './dtos/notification-response.dto';

@Injectable()
export class NotificationStreamService {
  private readonly clients = new Map<number, Set<Response>>();

  // ------------------ ADD CLIENT ------------------
  addClient(userId: number, response: Response): void {
    const existingClients = this.clients.get(userId) ?? new Set<Response>();
    existingClients.add(response);
    this.clients.set(userId, existingClients);
  }

  // ------------------ REMOVE CLIENT ------------------
  removeClient(userId: number, response: Response): void {
    const existingClients = this.clients.get(userId);
    if (!existingClients) return;

    existingClients.delete(response);

    if (existingClients.size === 0) {
      this.clients.delete(userId);
    }
  }

  // ------------------ EMIT NOTIFICATION ------------------
  emitNotification(
    userId: number,
    notification: NotificationResponseDto,
  ): void {
    const existingClients = this.clients.get(userId);
    if (!existingClients?.size) return;

    const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;

    existingClients.forEach((response) => {
      response.write(payload);
    });
  }

  // ------------------ EMIT CONNECTED ------------------
  emitConnected(userId: number, response: Response): void {
    const payload = `event: connected\ndata: ${JSON.stringify({ userId })}\n\n`;
    response.write(payload);
  }
}
