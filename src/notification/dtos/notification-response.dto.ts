import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AuthorSummaryDto } from 'src/common/dtos/author-summary.dto';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationEntityType } from '../enums/notification-entity-type.enum';

export class NotificationResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ enum: NotificationType })
  @Expose()
  type: NotificationType;

  @ApiProperty({ enum: NotificationEntityType })
  @Expose()
  entityType: NotificationEntityType;

  @ApiProperty({ example: 42 })
  @Expose()
  entityId: number;

  @ApiProperty({ example: 'john_doe upvoted your post' })
  @Expose()
  message: string;

  @ApiProperty({ example: '/posts/12' })
  @Expose()
  targetUrl: string;

  @ApiProperty({ example: false })
  @Expose()
  isRead: boolean;

  @ApiProperty({ example: '2026-03-27T10:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: () => AuthorSummaryDto })
  @Expose()
  @Type(() => AuthorSummaryDto)
  actor: AuthorSummaryDto;
}
