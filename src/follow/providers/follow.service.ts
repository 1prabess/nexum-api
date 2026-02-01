import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../follow.entity';
import { UserService } from 'src/user/providers/user.service';
import { paginate } from 'src/common/utils/pagination';
import { User } from 'src/user/user.entity';
import { IUserProfile } from 'src/common/interfaces/user-profile.interface';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,

    private readonly userService: UserService,
  ) {}

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
  }

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

    const items: IUserProfile[] = followers.map((f) =>
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

    const items: IUserProfile[] = followings.map((f) =>
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

  private mapToUserDto(user: User): IUserProfile {
    const {
      id,
      username,
      fullName,
      bio,
      avatar,
      coverPhoto,
      followersCount,
      followingCount,
      createdAt,
      updatedAt,
      email,
    } = user;

    return {
      id,
      username,
      fullName,
      email,
      bio,
      avatar,
      coverPhoto,
      followersCount,
      followingCount,
      createdAt,
      updatedAt,
    };
  }
}
