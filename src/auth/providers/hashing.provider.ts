import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingProvider {
  abstract hashValue(value: string): Promise<string>;
  abstract compareValue(value: string, hashValue: string): Promise<boolean>;
}
