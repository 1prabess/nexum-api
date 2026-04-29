import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './tag.entity';
import { TagSeederService } from './tag-seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tag])],
  exports: [TagService],
  controllers: [TagController],
  providers: [TagService, TagSeederService],
})
export class TagModule {}
