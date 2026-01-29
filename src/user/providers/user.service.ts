import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    const hashedPassword = await this.HashingProvider.hashValue(password);

    const user = this.UserRepository.create({
      username,
      email,
      password: hashedPassword,
      avatar,
    });

    return await this.UserRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.UserRepository.findOneBy({ email });
  }

  async findByUserName(username: string): Promise<User | null> {
    return await this.UserRepository.findOneBy({ username });
  }
}
