import { Module } from '@nestjs/common';
import { Follow } from './follow.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowController } from './follow.controller';
import { FollowService } from './providers/follow.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Follow]), UserModule],
  controllers: [FollowController],
  providers: [FollowService],
})
export class FollowModule {}
