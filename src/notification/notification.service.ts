import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationResponseDto } from './dtos/notification-response.dto';
import { UnreadNotificationCountDto } from './dtos/unread-notification-count.dto';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationEntityType } from './enums/notification-entity-type.enum';
import { NotificationStreamService } from './notification-stream.service';

type CreateNotificationPayload = {
  recipientId: number;
  actorId: number;
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId: number;
  message: string;
  targetUrl: string;
  dedupe?: boolean;
  replaceExisting?: boolean;
};

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationStreamService: NotificationStreamService,
  ) {}

  // ------------------ CREATE NOTIFICATION ------------------
  async createNotification({
    recipientId,
    actorId,
    type,
    entityType,
    entityId,
    message,
    targetUrl,
    dedupe = false,
    replaceExisting = false,
  }: CreateNotificationPayload): Promise<void> {
    if (recipientId === actorId) return;

    if (dedupe) {
      const existingNotification = await this.notificationRepository.findOne({
        where: {
          recipient: { id: recipientId },
          actor: { id: actorId },
          type,
          entityType,
          entityId,
        },
      });

      if (existingNotification) {
        if (replaceExisting) {
          await this.notificationRepository.remove(existingNotification);
        } else {
          existingNotification.message = message;
          existingNotification.targetUrl = targetUrl;
          existingNotification.isRead = false;
          await this.notificationRepository.save(existingNotification);

          const dto = plainToInstance(
            NotificationResponseDto,
            {
              ...existingNotification,
              actor: { id: actorId },
            },
            {
              excludeExtraneousValues: true,
            },
          );

          const savedNotification = await this.notificationRepository.findOne({
            where: { id: existingNotification.id },
            relations: ['actor'],
          });

          this.notificationStreamService.emitNotification(
            recipientId,
            savedNotification
              ? plainToInstance(NotificationResponseDto, savedNotification, {
                  excludeExtraneousValues: true,
                })
              : dto,
          );
          return;
        }
      }
    }

    const notification = this.notificationRepository.create({
      recipient: { id: recipientId },
      actor: { id: actorId },
      type,
      entityType,
      entityId,
      message,
      targetUrl,
    });

    await this.notificationRepository.save(notification);

    const savedNotification = await this.notificationRepository.findOne({
      where: { id: notification.id },
      relations: ['actor'],
    });

    if (savedNotification) {
      const dto = plainToInstance(NotificationResponseDto, savedNotification, {
        excludeExtraneousValues: true,
      });

      this.notificationStreamService.emitNotification(recipientId, dto);
    }
  }

  // ------------------ NOTIFY FOLLOW ------------------
  async notifyFollow({
    recipientId,
    actorId,
    actorUsername,
  }: {
    recipientId: number;
    actorId: number;
    actorUsername: string;
  }): Promise<void> {
    await this.createNotification({
      recipientId,
      actorId,
      type: NotificationType.FOLLOW,
      entityType: NotificationEntityType.PROFILE,
      entityId: actorId,
      message: `${actorUsername} started following you`,
      targetUrl: `/profile/${actorId}`,
      dedupe: true,
      replaceExisting: true,
    });
  }

  // ------------------ NOTIFY POST VOTE ------------------
  async notifyPostVote({
    recipientId,
    actorId,
    actorUsername,
    postId,
    voteType,
  }: {
    recipientId: number;
    actorId: number;
    actorUsername: string;
    postId: number;
    voteType: 'UP' | 'DOWN';
  }): Promise<void> {
    await this.createNotification({
      recipientId,
      actorId,
      type: NotificationType.POST_VOTE,
      entityType: NotificationEntityType.POST,
      entityId: postId,
      message: `${actorUsername} ${voteType === 'UP' ? 'upvoted' : 'downvoted'} your post`,
      targetUrl: `/posts/${postId}`,
      dedupe: true,
      replaceExisting: true,
    });
  }

  // ------------------ NOTIFY QUESTION VOTE ------------------
  async notifyQuestionVote({
    recipientId,
    actorId,
    actorUsername,
    questionId,
    voteType,
  }: {
    recipientId: number;
    actorId: number;
    actorUsername: string;
    questionId: number;
    voteType: 'UP' | 'DOWN';
  }): Promise<void> {
    await this.createNotification({
      recipientId,
      actorId,
      type: NotificationType.QUESTION_VOTE,
      entityType: NotificationEntityType.QUESTION,
      entityId: questionId,
      message: `${actorUsername} ${voteType === 'UP' ? 'upvoted' : 'downvoted'} your question`,
      targetUrl: `/questions/${questionId}`,
      dedupe: true,
      replaceExisting: true,
    });
  }

  // ------------------ NOTIFY COMMENT ON POST ------------------
  async notifyCommentOnPost({
    recipientId,
    actorId,
    actorUsername,
    postId,
  }: {
    recipientId: number;
    actorId: number;
    actorUsername: string;
    postId: number;
  }): Promise<void> {
    await this.createNotification({
      recipientId,
      actorId,
      type: NotificationType.COMMENT_ON_POST,
      entityType: NotificationEntityType.POST,
      entityId: postId,
      message: `${actorUsername} commented on your post`,
      targetUrl: `/posts/${postId}`,
    });
  }

  // ------------------ NOTIFY ANSWER ON QUESTION ------------------
  async notifyAnswerOnQuestion({
    recipientId,
    actorId,
    actorUsername,
    questionId,
  }: {
    recipientId: number;
    actorId: number;
    actorUsername: string;
    questionId: number;
  }): Promise<void> {
    await this.createNotification({
      recipientId,
      actorId,
      type: NotificationType.ANSWER_ON_QUESTION,
      entityType: NotificationEntityType.QUESTION,
      entityId: questionId,
      message: `${actorUsername} answered your question`,
      targetUrl: `/questions/${questionId}`,
    });
  }

  // ------------------ NOTIFY COMMENT VOTE ------------------
  async notifyCommentVote({
    recipientId,
    actorId,
    actorUsername,
    commentId,
    postId,
    voteType,
  }: {
    recipientId: number;
    actorId: number;
    actorUsername: string;
    commentId: number;
    postId: number;
    voteType: 'UP' | 'DOWN';
  }): Promise<void> {
    await this.createNotification({
      recipientId,
      actorId,
      type: NotificationType.COMMENT_VOTE,
      entityType: NotificationEntityType.COMMENT,
      entityId: commentId,
      message: `${actorUsername} ${voteType === 'UP' ? 'upvoted' : 'downvoted'} your comment`,
      targetUrl: `/posts/${postId}`,
      dedupe: true,
      replaceExisting: true,
    });
  }

  // ------------------ NOTIFY ANSWER VOTE ------------------
  async notifyAnswerVote({
    recipientId,
    actorId,
    actorUsername,
    answerId,
    questionId,
    voteType,
  }: {
    recipientId: number;
    actorId: number;
    actorUsername: string;
    answerId: number;
    questionId: number;
    voteType: 'UP' | 'DOWN';
  }): Promise<void> {
    await this.createNotification({
      recipientId,
      actorId,
      type: NotificationType.ANSWER_VOTE,
      entityType: NotificationEntityType.ANSWER,
      entityId: answerId,
      message: `${actorUsername} ${voteType === 'UP' ? 'upvoted' : 'downvoted'} your answer`,
      targetUrl: `/questions/${questionId}`,
      dedupe: true,
      replaceExisting: true,
    });
  }

  // ------------------ NOTIFY ANSWER ACCEPTED ------------------
  async notifyAnswerAccepted({
    recipientId,
    actorId,
    actorUsername,
    answerId,
    questionId,
  }: {
    recipientId: number;
    actorId: number;
    actorUsername: string;
    answerId: number;
    questionId: number;
  }): Promise<void> {
    await this.createNotification({
      recipientId,
      actorId,
      type: NotificationType.ANSWER_ACCEPTED,
      entityType: NotificationEntityType.ANSWER,
      entityId: answerId,
      message: `${actorUsername} accepted your answer`,
      targetUrl: `/questions/${questionId}`,
      dedupe: true,
    });
  }

  // ------------------ GET NOTIFICATIONS ------------------
  async getNotifications(
    userId: number,
    limit = 20,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.find({
      where: {
        recipient: { id: userId },
      },
      relations: ['actor'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });

    return plainToInstance(NotificationResponseDto, notifications, {
      excludeExtraneousValues: true,
    });
  }

  // ------------------ GET UNREAD COUNT ------------------
  async getUnreadCount(userId: number): Promise<UnreadNotificationCountDto> {
    const count = await this.notificationRepository.count({
      where: {
        recipient: { id: userId },
        isRead: false,
      },
    });

    return plainToInstance(
      UnreadNotificationCountDto,
      { count },
      { excludeExtraneousValues: true },
    );
  }

  // ------------------ MARK AS READ ------------------
  async markAsRead(userId: number, notificationId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        recipient: { id: userId },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    await this.notificationRepository.save(notification);
  }

  // ------------------ MARK ALL AS READ ------------------
  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      {
        recipient: { id: userId },
        isRead: false,
      },
      {
        isRead: true,
      },
    );
  }
}
