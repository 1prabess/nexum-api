import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CommunityVisibility } from '../enums/community-visibility.enum';

export class CommunitySummaryDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Tech Geeks' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'https://example.com/images/avatar.png' })
  @Expose()
  avatar?: string;

  @ApiProperty({
    enum: CommunityVisibility,
    example: CommunityVisibility.PUBLIC,
  })
  @Expose()
  visibility: CommunityVisibility;
}
