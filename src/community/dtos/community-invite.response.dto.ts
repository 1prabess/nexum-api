import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CommunityInviteStatus } from '../enums/community-invite-status.enum';
import { CommunitySummaryDto } from './community-summary.dto';
import { UserResponseDto } from 'src/user/dtos/user-response.dto';

export class CommunityInviteResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ type: CommunitySummaryDto })
  @Expose()
  @Type(() => CommunitySummaryDto)
  community: CommunitySummaryDto;

  @ApiProperty({
    enum: CommunityInviteStatus,
    example: CommunityInviteStatus.PENDING,
  })
  @Expose()
  status: CommunityInviteStatus;

  @ApiProperty({ example: '2026-02-19T08:06:47.250Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: UserResponseDto })
  @Expose()
  @Type(() => UserResponseDto)
  invitedBy: UserResponseDto;
}
