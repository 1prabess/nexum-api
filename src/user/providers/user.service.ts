import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from 'src/auth/providers/hashing.provider';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly UserRepository: Repository<User>,

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

    const user = this.UserRepository.create({
      username,
      email,
      password: hashedPassword,
      avatar,
    });

    return await this.UserRepository.save(user);
  }

  async findAll() {
    return await this.UserRepository.find();
  }

  async findById(userId: number): Promise<User | null> {
    return await this.UserRepository.findOneBy({
      id: userId,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.UserRepository.findOneBy({ email });
  }

  async findByUserName(username: string): Promise<User | null> {
    return await this.UserRepository.findOneBy({ username });
  }

  async findByIdWithRefreshToken(userId: number): Promise<User | null> {
    return await this.UserRepository.createQueryBuilder('user')
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

    await this.UserRepository.save(user);
  }
}
