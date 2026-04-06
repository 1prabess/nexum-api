import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';

import { Question } from './entities/question.entity';
import { QuestionVote } from './entities/question-vote.entity';
import { CreateQuestionDto } from './dtos/create-question.dto';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { TagService } from 'src/tag/tag.service';
import { CommunityService } from 'src/community/community.service';
import { SearchService } from 'src/search/search.service';
import { AnswerService } from 'src/answer/answer.service';
import { paginate } from 'src/common/utils/pagination';
import { extractText } from 'src/common/utils/extract-text.utils';
import { VoteType } from 'src/common/enums/vote-type.enum';
import { QuestionResponseDto } from 'src/common/dtos/question-response.dto';
import { PaginatedResponseDto } from 'src/common/dtos/pagination.dto';
import { QuestionUrgency } from './enums/question-urgency.enum';
import { AnswerResponseDto } from 'src/answer/dtos/answer-response.dto';
import { CommunityVisibility } from 'src/community/enums/community-visibility.enum';
import { NotificationService } from 'src/notification/notification.service';
import { UpdateQuestionDto } from './dtos/update-question.dto';
import { AuthorSummaryDto } from 'src/common/dtos/author-summary.dto';
import { FollowService } from 'src/follow/follow.service';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly tagService: TagService,
    @Inject(forwardRef(() => CommunityService))
    private readonly communityService: CommunityService,
    private readonly searchService: SearchService,
    private readonly dataSource: DataSource,
    private readonly answerService: AnswerService,
    private readonly notificationService: NotificationService,
    private readonly followService: FollowService,
  ) {}

  // ------------------ CREATE QUESTION ------------------
  async createQuestion(
    user: ICurrentUser,
    createQuestionDto: CreateQuestionDto,
  ): Promise<void> {
    if (!createQuestionDto.tagIds || createQuestionDto.tagIds.length < 1) {
      throw new BadRequestException('At least one tag is required');
    }

    const tags = await this.tagService.findByIds(createQuestionDto.tagIds);
    if (tags.length !== createQuestionDto.tagIds.length) {
      throw new BadRequestException('One or more tags are invalid');
    }

    const textContent = extractText(createQuestionDto.content);

    const question = this.questionRepository.create({
      title: createQuestionDto.title,
      content: createQuestionDto.content,
      searchContent: textContent,
      author: { id: user.id },
      tags,
      urgency: createQuestionDto.urgency ?? QuestionUrgency.MEDIUM,
    });

    await this.questionRepository.save(question);

    await this.searchService.computeAndStoreVector(
      question,
      this.questionRepository,
    );
  }

  // ------------------ CREATE COMMUNITY QUESTION ------------------
  async createCommunityQuestion(
    user: ICurrentUser,
    communityId: number,
    createQuestionDto: CreateQuestionDto,
  ): Promise<void> {
    if (!createQuestionDto.tagIds || createQuestionDto.tagIds.length < 1) {
      throw new BadRequestException('At least one tag is required');
    }

    const community = await this.communityService.findById(communityId);
    if (!community) throw new NotFoundException('Community not found');

    const isMember = await this.communityService.isMember(communityId, user.id);
    if (!isMember) {
      throw new ForbiddenException(
        'You must be a member of the community to post',
      );
    }

    const tags = await this.tagService.findByIds(createQuestionDto.tagIds);
    if (tags.length !== createQuestionDto.tagIds.length) {
      throw new BadRequestException('One or more tags are invalid');
    }

    const textContent = extractText(createQuestionDto.content);

    const question = this.questionRepository.create({
      title: createQuestionDto.title,
      content: createQuestionDto.content,
      searchContent: textContent,
      author: { id: user.id },
      community,
      tags,
      urgency: createQuestionDto.urgency ?? QuestionUrgency.MEDIUM,
    });

    await this.questionRepository.save(question);

    await this.searchService.computeAndStoreVector(
      question,
      this.questionRepository,
    );
  }

  // ------------------ GET QUESTIONS BY COMMUNITY ------------------
  async getQuestionsByCommunity(
    communityId: number,
    page: number,
    limit: number,
    currentUserId: number,
  ): Promise<[QuestionResponseDto[], number]> {
    const [questions, total] = await this.questionRepository.findAndCount({
      where: { community: { id: communityId } },
      relations: [
        'author',
        'tags',
        'votes',
        'votes.user',
        'answers',
        'answers.author',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items = questions.map((q) => this.mapQuestionToDto(q, currentUserId));

    return [items, total];
  }

  // ------------------ GET GLOBAL QUESTIONS ------------------
  async getGlobalQuestionsFeed({
    page,
    limit,
    currentUserId,
  }: {
    page: number;
    limit: number;
    currentUserId: number;
  }): Promise<PaginatedResponseDto<QuestionResponseDto>> {
    const qb = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.tags', 'tags')
      .leftJoinAndSelect('question.votes', 'votes')
      .leftJoinAndSelect('votes.user', 'voteUser')
      .leftJoinAndSelect('question.community', 'community')
      .leftJoinAndSelect('question.answers', 'answers') // include answers
      .leftJoinAndSelect('answers.author', 'answerAuthor')
      .addSelect(['question.upvotes', 'question.downvotes'])
      .where('question.communityId IS NULL')
      .orWhere('community.visibility = :visibility', { visibility: 'PUBLIC' })
      .orderBy('question.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [questions, total] = await qb.getManyAndCount();

    const items = questions.map((q) => this.mapQuestionToDto(q, currentUserId));

    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/questions`,
    });
  }

  // ------------------ GET SINGLE QUESTION ------------------
  async getQuestion(
    questionId: number,
    currentUserId?: number,
  ): Promise<QuestionResponseDto> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: [
        'author',
        'tags',
        'votes',
        'votes.user',
        'community',
        'answers',
        'answers.author',
      ],
    });

    if (!question) throw new NotFoundException('Question not found');

    return this.mapQuestionToDto(question, currentUserId);
  }

  // ------------------ GET QUESTIONS OF FOLLOWED USERS ------------------
  async getFollowingQuestionsFeed({
    page,
    limit,
    currentUserId,
  }: {
    page: number;
    limit: number;
    currentUserId: number;
  }): Promise<PaginatedResponseDto<QuestionResponseDto>> {
    const followingIds = await this.followService.getFollowingIds(currentUserId);

    if (followingIds.length === 0) {
      return paginate({
        items: [],
        totalItems: 0,
        currentPage: page,
        limit,
        route: `${process.env.API_URL}/questions/following`,
      });
    }

    const qb = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.tags', 'tags')
      .leftJoinAndSelect('question.votes', 'votes')
      .leftJoinAndSelect('votes.user', 'voteUser')
      .leftJoinAndSelect('question.community', 'community')
      .leftJoinAndSelect('question.answers', 'answers')
      .leftJoinAndSelect('answers.author', 'answerAuthor')
      .addSelect(['question.upvotes', 'question.downvotes'])
      .where('author.id IN (:...followingIds)', { followingIds })
      .andWhere(
        '(question.communityId IS NULL OR community.visibility = :visibility)',
        { visibility: CommunityVisibility.PUBLIC },
      )
      .orderBy('question.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [questions, total] = await qb.getManyAndCount();
    const items = questions.map((q) => this.mapQuestionToDto(q, currentUserId));

    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/questions/following`,
    });
  }

  // ------------------ UPDATE QUESTION ------------------
  async updateQuestion(
    user: ICurrentUser,
    questionId: number,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<QuestionResponseDto> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['author', 'tags', 'votes', 'votes.user', 'community'],
    });

    if (!question) throw new NotFoundException('Question not found');

    if (question.author.id !== user.id) {
      throw new ForbiddenException('You can only update your own question');
    }

    if (updateQuestionDto.tagIds && updateQuestionDto.tagIds.length < 1) {
      throw new BadRequestException('At least one tag is required');
    }

    if (updateQuestionDto.tagIds) {
      const tags = await this.tagService.findByIds(updateQuestionDto.tagIds);

      if (tags.length !== updateQuestionDto.tagIds.length) {
        throw new BadRequestException('One or more tags are invalid');
      }

      question.tags = tags;
    }

    if (typeof updateQuestionDto.title === 'string') {
      question.title = updateQuestionDto.title;
    }

    if (typeof updateQuestionDto.content === 'string') {
      question.content = updateQuestionDto.content;
      question.searchContent = extractText(updateQuestionDto.content);
    }

    if (updateQuestionDto.urgency) {
      question.urgency = updateQuestionDto.urgency;
    }

    await this.questionRepository.save(question);
    await this.searchService.computeAndStoreVector(
      question,
      this.questionRepository,
    );

    const updatedQuestion = await this.getQuestion(questionId, user.id);
    return updatedQuestion;
  }

  // ------------------ DELETE QUESTION ------------------
  async deleteQuestion(user: ICurrentUser, questionId: number): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['author', 'community'],
    });

    if (!question) throw new NotFoundException('Question not found');

    const canManageCommunityQuestion = question.community
      ? await this.communityService.canManageContent(
          question.community.id,
          user.id,
        )
      : false;

    if (question.author.id !== user.id && !canManageCommunityQuestion) {
      throw new ForbiddenException('You can only delete your own question');
    }

    await this.questionRepository.remove(question);
  }

  // ------------------ GET ANSWERS OF A QUESTION ------------------
  async getQuestionAnswers(questionId: number): Promise<AnswerResponseDto[]> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException('Question not found');

    return this.answerService.findByQuestion(questionId);
  }

  // ------------------ VOTE ON QUESTION (TRANSACTIONAL) ------------------
  async voteOnQuestion(
    userId: number,
    questionId: number,
    type: VoteType,
  ): Promise<{ upvotes: number; downvotes: number }> {
    let shouldNotify = false;
    let recipientId: number | null = null;
    let actorUsername = '';

    await this.dataSource.transaction(async (manager) => {
      const existingVote = await manager.findOne(QuestionVote, {
        where: { question: { id: questionId }, user: { id: userId } },
        relations: ['question'],
      });

      const question = await manager.findOne(Question, {
        where: { id: questionId },
        relations: ['author'],
      });
      if (!question) throw new NotFoundException('Question not found');

      const actor = await manager.query(
        'SELECT username FROM users WHERE id = $1 LIMIT 1',
        [userId],
      );
      actorUsername = actor[0]?.username ?? '';
      recipientId = question.author.id;

      if (!existingVote) {
        const vote = manager.create(QuestionVote, {
          question,
          user: { id: userId },
          type,
        });
        await manager.save(vote);
        await manager.increment(
          Question,
          { id: questionId },
          type === VoteType.UP ? 'upvotes' : 'downvotes',
          1,
        );
        shouldNotify = true;
        return;
      }

      if (existingVote.type === type) {
        await manager.remove(existingVote);
        await manager.decrement(
          Question,
          { id: questionId },
          type === VoteType.UP ? 'upvotes' : 'downvotes',
          1,
        );
        return;
      }

      const previousType = existingVote.type;
      existingVote.type = type;
      await manager.save(existingVote);

      if (previousType === VoteType.UP) {
        await manager.decrement(Question, { id: questionId }, 'upvotes', 1);
        await manager.increment(Question, { id: questionId }, 'downvotes', 1);
      } else {
        await manager.decrement(Question, { id: questionId }, 'downvotes', 1);
        await manager.increment(Question, { id: questionId }, 'upvotes', 1);
      }

      shouldNotify = true;
    });

    if (shouldNotify && recipientId) {
      await this.notificationService.notifyQuestionVote({
        recipientId,
        actorId: userId,
        actorUsername,
        questionId,
        voteType: type,
      });
    }

    const updatedQuestion = await this.questionRepository.findOne({
      where: { id: questionId },
      select: ['upvotes', 'downvotes'],
    });

    if (!updatedQuestion)
      throw new NotFoundException('Question not found after voting');

    return {
      upvotes: updatedQuestion.upvotes,
      downvotes: updatedQuestion.downvotes,
    };
  }

  async getQuestionVoters(
    questionId: number,
    type: VoteType,
  ): Promise<AuthorSummaryDto[]> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });

    if (!question) throw new NotFoundException('Question not found');

    const votes = await this.dataSource.getRepository(QuestionVote).find({
      where: { question: { id: questionId }, type },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    return plainToInstance(
      AuthorSummaryDto,
      votes.map((vote) => vote.user),
      { excludeExtraneousValues: true },
    );
  }

  // ------------------ GET QUESTIONS OF A USER ------------------
  async getQuestionsByUser({
    userId,
    page,
    limit,
    currentUserId,
  }: {
    userId: number;
    page: number;
    limit: number;
    currentUserId: number;
  }): Promise<PaginatedResponseDto<QuestionResponseDto>> {
    const query = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.tags', 'tags')
      .leftJoinAndSelect('question.votes', 'votes')
      .leftJoinAndSelect('votes.user', 'voteUser')
      .leftJoinAndSelect('question.community', 'community')
      .leftJoinAndSelect('question.answers', 'answers')
      .leftJoinAndSelect('answers.author', 'answerAuthor')
      .where('author.id = :userId', { userId })
      .andWhere(
        '(question.communityId IS NULL OR community.visibility != :privateVisibility)',
        { privateVisibility: CommunityVisibility.PRIVATE },
      )
      .orderBy('question.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [questions, total] = await query.getManyAndCount();

    const items = questions.map((q) => this.mapQuestionToDto(q, currentUserId));

    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/questions`,
    });
  }

  // ------------------ FIND QUESTION ENTITY ------------------
  async findQuestionEntity(questionId: number): Promise<Question | null> {
    return this.questionRepository.findOne({
      where: { id: questionId },
      relations: [
        'author',
        'tags',
        'community',
        'votes',
        'votes.user',
        'answers',
        'answers.author',
      ],
    });
  }

  // ------------------ (HELPER) MAP TO RESPONSE DTO ------------------
  private mapQuestionToDto(
    question: Question,
    currentUserId?: number,
  ): QuestionResponseDto {
    const dto = plainToInstance(QuestionResponseDto, question, {
      excludeExtraneousValues: true,
    });

    dto.userVote = currentUserId
      ? (question.votes?.find((v) => v.user.id === currentUserId)?.type ?? null)
      : null;
    dto.answerCount = question.answers?.length ?? 0;

    return dto;
  }
}
