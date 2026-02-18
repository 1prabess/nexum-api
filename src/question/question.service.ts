import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { Repository } from 'typeorm';
import { TagService } from 'src/tag/providers/tag.service';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { extractText } from 'src/common/utils/extract-text.utils';
import { QuestionUrgency } from './enums/question-urgency.enum';

@Injectable()
@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,

    private readonly tagService: TagService,
  ) {}

  /**
   * Creates a new standalone question (not tied to any community)
   * @param user - Currently authenticated user
   * @param createQuestionDto - DTO containing question data
   * @throws BadRequestException if no tags are provided or invalid tags are passed
   */
  async create(
    user: ICurrentUser,
    createQuestionDto: CreateQuestionDto,
  ): Promise<Question> {
    // Ensure at least one tag is provided
    if (!createQuestionDto.tagIds || createQuestionDto.tagIds.length < 1) {
      throw new BadRequestException('At least one tag is required');
    }

    // Fetch tags by IDs from TagService
    const tags = await this.tagService.findByIds(createQuestionDto.tagIds);

    // Verify that all requested tags exist
    if (tags.length !== createQuestionDto.tagIds.length) {
      throw new BadRequestException('One or more tags are invalid');
    }

    // Convert rich content to plain text for search
    const textContent = extractText(createQuestionDto.content);

    // Create a new Question entity instance
    const question = this.questionRepository.create({
      title: createQuestionDto.title,
      content: createQuestionDto.content,
      searchContent: textContent,
      author: { id: user.id },
      tags,
      urgency: createQuestionDto.urgency ?? QuestionUrgency.MEDIUM,
    });

    // Persist the new question in the database
    return await this.questionRepository.save(question);
  }
}
