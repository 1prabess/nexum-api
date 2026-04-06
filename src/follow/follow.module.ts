import { forwardRef, Module } from '@nestjs/common';
import { Follow } from './follow.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';
import { UserModule } from 'src/user/user.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Follow]),
    forwardRef(() => UserModule),
    NotificationModule,
  ],
  controllers: [FollowController],
  providers: [FollowService],
  exports: [FollowService],
})
export class FollowModule {}
