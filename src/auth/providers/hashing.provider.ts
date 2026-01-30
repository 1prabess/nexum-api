import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingProvider {
  abstract hash(value: string): Promise<string>;
  abstract compare(value: string, hashValue: string): Promise<boolean>;
}
