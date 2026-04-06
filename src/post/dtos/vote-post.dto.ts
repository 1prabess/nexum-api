import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { VoteType } from '../../common/enums/vote-type.enum';

export class VotePostDto {
  @ApiProperty({
    description: 'Type of vote',
    enum: VoteType,
  })
  @IsEnum(VoteType, { message: 'Vote type must be UP or DOWN' })
  type: VoteType;
}
