import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { NotificationService } from './notification.service';
import { NotificationResponseDto } from './dtos/notification-response.dto';
import { UnreadNotificationCountDto } from './dtos/unread-notification-count.dto';
import type { Request, Response } from 'express';
import { NotificationStreamService } from './notification-stream.service';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';

@Controller('notifications')
@UseGuards(JwtAccessTokenAuthGuard)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationStreamService: NotificationStreamService,
  ) {}

  // ------------------ GET NOTIFICATIONS ------------------
  @ApiOperation({ summary: 'Get notifications of the current user' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of notifications to fetch',
    required: false,
    type: Number,
  })
  @ApiSuccessResponse(NotificationResponseDto, {
    isArray: true,
    message: 'Notifications fetched successfully',
  })
  @Get()
  @ResponseMessage('Notifications fetched successfully')
  getNotifications(
    @CurrentUser() user: ICurrentUser,
    @Query(
      'limit',
      new ParseIntPipe({ optional: true }),
      new DefaultValuePipe(20),
    )
    limit: number,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationService.getNotifications(user.id, limit);
  }

  // ------------------ GET UNREAD COUNT ------------------
  @ApiOperation({ summary: 'Get unread notification count of the current user' })
  @ApiSuccessResponse(UnreadNotificationCountDto, {
    message: 'Unread notification count fetched successfully',
  })
  @Get('unread-count')
  @ResponseMessage('Unread notification count fetched successfully')
  getUnreadCount(
    @CurrentUser() user: ICurrentUser,
  ): Promise<UnreadNotificationCountDto> {
    return this.notificationService.getUnreadCount(user.id);
  }

  // ------------------ STREAM NOTIFICATIONS ------------------
  @ApiOperation({ summary: 'Stream notifications of the current user' })
  @Get('stream')
  stream(
    @CurrentUser() user: ICurrentUser,
    @Req() request: Request,
    @Res() response: Response,
  ): void {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders();

    this.notificationStreamService.addClient(user.id, response);
    this.notificationStreamService.emitConnected(user.id, response);

    request.on('close', () => {
      this.notificationStreamService.removeClient(user.id, response);
      response.end();
    });
  }

  // ------------------ MARK AS READ ------------------
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiSuccessResponse(null, {
    message: 'Notification marked as read',
    noData: true,
  })
  @Patch(':id/read')
  @ResponseMessage('Notification marked as read')
  markAsRead(
    @CurrentUser() user: ICurrentUser,
    @Param('id', ParseIntPipe) notificationId: number,
  ): Promise<void> {
    return this.notificationService.markAsRead(user.id, notificationId);
  }

  // ------------------ MARK ALL AS READ ------------------
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiSuccessResponse(null, {
    message: 'All notifications marked as read',
    noData: true,
  })
  @Patch('read-all')
  @ResponseMessage('All notifications marked as read')
  markAllAsRead(@CurrentUser() user: ICurrentUser): Promise<void> {
    return this.notificationService.markAllAsRead(user.id);
  }
}
