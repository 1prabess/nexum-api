import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UserController } from './user.controller';
import { FollowModule } from 'src/follow/follow.module';
import { Community } from 'src/community/entities/community.entity';
import { CommunityMember } from 'src/community/entities/community-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Community, CommunityMember]),
    forwardRef(() => AuthModule),
    forwardRef(() => FollowModule),
  ],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
