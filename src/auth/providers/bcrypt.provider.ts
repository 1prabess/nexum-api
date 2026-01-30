import { Injectable } from '@nestjs/common';
import { HashingProvider } from './hashing.provider';
import bcrypt from 'bcryptjs';

@Injectable()
export class BcryptProvider extends HashingProvider {
  async hash(value: string): Promise<string> {
    return await bcrypt.hash(value, 10);
  }

  async compare(value: string, hashValue: string): Promise<boolean> {
    return await bcrypt.compare(value, hashValue);
  }
}
