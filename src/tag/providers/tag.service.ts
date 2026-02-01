import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from '../tag.entity';
import { CreateTagDto } from '../dtos/create-tag.dto';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  findAll(): Promise<Tag[]> {
    return this.tagRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findByIds(ids: number[]): Promise<Tag[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    return this.tagRepository.find({
      where: {
        id: In(ids),
      },
    });
  }

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const normalizedTag = createTagDto.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');

    const existing = await this.tagRepository.findOne({
      where: { name: normalizedTag },
    });

    if (existing) {
      throw new BadRequestException('Tag already exists');
    }

    const tag = this.tagRepository.create({ name: normalizedTag });
    return this.tagRepository.save(tag);
  }
}
