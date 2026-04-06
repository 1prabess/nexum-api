import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './follow.entity';
import { UserService } from 'src/user/user.service';
import { paginate } from 'src/common/utils/pagination';
import { User } from 'src/user/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { UserResponseDto } from 'src/user/dtos/user-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,

    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,

    private readonly notificationService: NotificationService,
  ) {}

  // ------------------ FOLLOW USER ------------------
  async follow(userId: number, targetId: number) {
    if (userId === targetId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const follower = await this.userService.findById(userId);
    const following = await this.userService.findById(targetId);

    if (!follower) throw new BadRequestException('User not found');
    if (!following) throw new BadRequestException('User not found');

    const alreadyFollowing = await this.followRepository.findOne({
      where: {
        follower: { id: userId },
        following: { id: targetId },
      },
    });

    if (alreadyFollowing) {
      throw new BadRequestException('Already following');
    }

    const newFollow = this.followRepository.create({
      follower,
      following,
    });

    await this.followRepository.save(newFollow);

    await this.userService.incrementFollowingCount(userId);
    await this.userService.incrementFollowersCount(targetId);

    await this.notificationService.notifyFollow({
      recipientId: targetId,
      actorId: userId,
      actorUsername: follower.username,
    });
  }

  // ------------------ UNFOLLOW USER ------------------
  async unfollow(userId: number, targetId: number) {
    if (userId === targetId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    const followRecord = await this.followRepository.findOne({
      where: {
        follower: { id: userId },
        following: { id: targetId },
      },
    });

    if (!followRecord) {
      throw new BadRequestException('You are not following this user');
    }

    await this.followRepository.remove(followRecord);

    await this.userService.decrementFollowingCount(userId);
    await this.userService.decrementFollowersCount(targetId);
  }

  // ------------------ GET FOLLOWERS ------------------
  async getFollowers({
    userId,
    page,
    limit,
  }: {
    userId: number;
    page: number;
    limit: number;
  }) {
    const [followers, total] = await this.followRepository.findAndCount({
      where: { following: { id: userId } },
      relations: ['follower'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const items: UserResponseDto[] = followers.map((f) =>
      this.mapToUserDto(f.follower),
    );

    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/users/${userId}/followers`,
    });
  }

  // ------------------ GET FOLLOWINGS ------------------
  async getFollowings({
    userId,
    page,
    limit,
  }: {
    userId: number;
    page: number;
    limit: number;
  }) {
    const [followings, total] = await this.followRepository.findAndCount({
      where: {
        follower: { id: userId },
      },
      relations: ['following'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const items: UserResponseDto[] = followings.map((f) =>
      this.mapToUserDto(f.following),
    );

    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/users/${userId}/followings`,
    });
  }

  // ------------------ CHECK FOLLOW RELATION ------------------
  async isFollowing(
    currentUserId: number,
    targetUserId: number,
  ): Promise<boolean> {
    if (currentUserId === targetUserId) return false;

    const follow = await this.followRepository.findOne({
      where: {
        follower: { id: currentUserId },
        following: { id: targetUserId },
      },
    });

    return !!follow;
  }

  // ------------------ GET FOLLOWING IDS ------------------
  async getFollowingIds(userId: number): Promise<number[]> {
    const followings = await this.followRepository.find({
      where: {
        follower: { id: userId },
      },
      relations: ['following'],
    });

    return followings.map((follow) => follow.following.id);
  }

  // ------------------ MAP USER TO RESPONSE DTO ------------------
  private mapToUserDto(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
