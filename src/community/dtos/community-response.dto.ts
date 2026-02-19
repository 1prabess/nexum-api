import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CommunityOwnerResponseDto } from './community-owner-response.dto';
import { CommunityVisibility } from '../enums/community-visibility.enum';

export class CommunityResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Tech Geeks' })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'A place for technology enthusiasts to share ideas.',
  })
  @Expose()
  description: string;

  @ApiProperty({ example: 'https://example.com/images/avatar.png' })
  @Expose()
  avatar: string;

  @ApiProperty({ example: 'https://example.com/images/cover.png' })
  @Expose()
  coverImage: string;

  @ApiProperty({ example: 'PUBLIC', enum: CommunityVisibility })
  @Expose()
  visibility: CommunityVisibility;

  @ApiProperty({ type: () => CommunityOwnerResponseDto })
  @Expose()
  @Type(() => CommunityOwnerResponseDto)
  owner: CommunityOwnerResponseDto;

  @ApiProperty({ example: '2026-02-18T09:12:32.842Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2026-02-18T09:12:32.842Z' })
  @Expose()
  updatedAt: Date;
}
