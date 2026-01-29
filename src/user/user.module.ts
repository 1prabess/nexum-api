import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './providers/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => AuthModule)],
  exports: [UserService],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
