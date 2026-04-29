import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';
import { DEFAULT_TAGS } from './default-tags';

@Injectable()
export class TagSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TagSeederService.name);

  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedDefaults();
  }

  private async seedDefaults(): Promise<void> {
    const values = DEFAULT_TAGS.map((name) => ({ name }));
    try {
      await this.tagRepository
        .createQueryBuilder()
        .insert()
        .into(Tag)
        .values(values)
        .orIgnore()
        .execute();
    } catch (error) {
      this.logger.warn(
        `Skipping default tag seed due to startup timing or DB state: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
