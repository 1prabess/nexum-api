import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CommunityMemberRole } from '../enums/community-member-role.enum';

export class CommunityMemberResponseDto {
  @ApiProperty({ example: 5 })
  @Expose()
  userId: number;

  @ApiProperty({ example: 'jane_doe' })
  @Expose()
  username: string;

  @ApiProperty({ example: 'Jane Doe', nullable: true })
  @Expose()
  fullName: string | null;

  @ApiProperty({
    example: 'https://example.com/images/avatar.png',
    nullable: true,
  })
  @Expose()
  avatar: string | null;

  @ApiProperty({
    example: CommunityMemberRole.MEMBER,
    enum: CommunityMemberRole,
  })
  @Expose()
  role: CommunityMemberRole;

  @ApiProperty({ example: '2026-02-18T09:12:32.842Z' })
  @Expose()
  joinedAt: Date;
}

