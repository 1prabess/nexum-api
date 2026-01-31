import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from 'src/auth/providers/hashing.provider';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UserDto } from '../dtos/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly HashingProvider: HashingProvider,
  ) {}

  async create(
    username: string,
    email: string,
    password: string,
    avatar?: string,
  ) {
    const existingEmail = await this.findByEmail(email);

    if (existingEmail) {
      throw new UnauthorizedException(
        'User with the same email already exists',
      );
    }

    const existingUserName = await this.findByUserName(username);

    if (existingUserName) {
      throw new UnauthorizedException(
        'User with the same username already exists',
      );
    }

    const hashedPassword = await this.HashingProvider.hash(password);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      avatar,
    });

    return await this.userRepository.save(user);
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findById(userId: number): Promise<User | null> {
    return await this.userRepository.findOneBy({
      id: userId,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async findByUserName(username: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ username });
  }

  async findByIdWithRefreshToken(userId: number): Promise<User | null> {
    return await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id: userId })
      .getOne();
  }

  async setRefreshToken(userId: number, refreshToken: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedRefreshToken = await this.HashingProvider.hash(refreshToken);

    user.refreshToken = hashedRefreshToken;

    await this.userRepository.save(user);
  }

  async getProfile(userId: number): Promise<UserDto> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const { password, refreshToken, ...safeUser } = user;

    return safeUser as UserDto;
  }

  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserDto> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (
      updateProfileDto.username &&
      updateProfileDto.username !== user.username
    ) {
      const existingUserName = await this.findByUserName(
        updateProfileDto.username,
      );
      if (existingUserName) {
        throw new UnauthorizedException('Username already in use');
      }
    }

    Object.assign(user, updateProfileDto);

    const updatedUser = await this.userRepository.save(user);

    const { password, refreshToken, ...safeUser } = updatedUser;

    return safeUser as UserDto;
  }

  async incrementFollowingCount(userId: number) {
    return await this.userRepository.increment(
      { id: userId },
      'followingCount',
      1,
    );
  }

  async incrementFollowersCount(userId: number) {
    return await this.userRepository.increment(
      { id: userId },
      'followersCount',
      1,
    );
  }

  async decrementFollowingCount(userId: number) {
    await this.userRepository.decrement({ id: userId }, 'followingCount', 1);
  }

  async decrementFollowersCount(userId: number) {
    await this.userRepository.decrement({ id: userId }, 'followersCount', 1);
  }
}
