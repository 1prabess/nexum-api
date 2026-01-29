import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/providers/user.service';
import { User } from 'src/user/user.entity';
import { HashingProvider } from './hashing.provider';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly UserService: UserService,
    private readonly hashingProvider: HashingProvider,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.UserService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashingProvider.compareValue(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
