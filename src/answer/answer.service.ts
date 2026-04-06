import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';

import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { QuestionService } from 'src/question/question.service';
import { VoteType } from 'src/common/enums/vote-type.enum';
import { AnswerResponseDto } from './dtos/answer-response.dto';
import { CreateAnswerDto } from './dtos/create-answer.dto';
import { AnswerVote } from './entities/answer-vote.entity';
import { Answer } from './entities/answer.entity';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class AnswerService {
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,

    @InjectRepository(AnswerVote)
    private readonly answerVoteRepository: Repository<AnswerVote>,

    @Inject(forwardRef(() => QuestionService))
    private readonly questionService: QuestionService,

    private readonly notificationService: NotificationService,

    private readonly dataSource: DataSource,
  ) {}

  // ------------------ CREATE ANSWER ------------------
  async create(user: ICurrentUser, dto: CreateAnswerDto): Promise<void> {
    const question = await this.questionService.findQuestionEntity(
      dto.questionId,
    );
    if (!question) throw new NotFoundException('Question not found');

    const answer = this.answerRepository.create({
      content: dto.content,
      author: { id: user.id },
      question,
    });

    await this.answerRepository.save(answer);

    await this.notificationService.notifyAnswerOnQuestion({
      recipientId: question.author.id,
      actorId: user.id,
      actorUsername: user.username,
      questionId: question.id,
    });
  }

  // ------------------ GET ANSWERS BY QUESTION ------------------
  async findByQuestion(
    questionId: number,
    currentUserId?: number,
  ): Promise<AnswerResponseDto[]> {
    const answers = await this.answerRepository.find({
      where: { question: { id: questionId } },
      relations: ['author', 'votes', 'votes.user'],
      order: { isAccepted: 'DESC', upvotes: 'DESC', createdAt: 'DESC' },
    });

    return answers.map((a) => this.mapAnswerToDto(a, currentUserId));
  }

  // ------------------ VOTE ON ANSWER ------------------
  async vote(
    userId: number,
    answerId: number,
    type: VoteType,
  ): Promise<{ upvotes: number; downvotes: number }> {
    let shouldNotify = false;
    let recipientId: number | null = null;
    let questionId: number | null = null;
    let actorUsername = '';

    const result = await this.dataSource.transaction(async (manager) => {
      const existingVote = await manager.findOne(AnswerVote, {
        where: { answer: { id: answerId }, user: { id: userId } },
        relations: ['answer'],
      });

      const answer = await manager.findOne(Answer, {
        where: { id: answerId },
        relations: ['author', 'question'],
      });
      if (!answer) throw new NotFoundException('Answer not found');

      const actor = await manager.query(
        'SELECT username FROM users WHERE id = $1 LIMIT 1',
        [userId],
      );
      actorUsername = actor[0]?.username ?? '';
      recipientId = answer.author.id;
      questionId = answer.question.id;

      if (!existingVote) {
        const vote = manager.create(AnswerVote, {
          answer,
          user: { id: userId },
          type,
        });
        await manager.save(vote);
        await manager.increment(
          Answer,
          { id: answerId },
          type === VoteType.UP ? 'upvotes' : 'downvotes',
          1,
        );
        shouldNotify = true;
        return {
          upvotes: answer.upvotes + (type === VoteType.UP ? 1 : 0),
          downvotes: answer.downvotes + (type === VoteType.DOWN ? 1 : 0),
        };
      }

      if (existingVote.type === type) {
        await manager.remove(existingVote);
        await manager.decrement(
          Answer,
          { id: answerId },
          type === VoteType.UP ? 'upvotes' : 'downvotes',
          1,
        );
        return {
          upvotes: answer.upvotes - (type === VoteType.UP ? 1 : 0),
          downvotes: answer.downvotes - (type === VoteType.DOWN ? 1 : 0),
        };
      }

      const previousType = existingVote.type;
      existingVote.type = type;
      await manager.save(existingVote);

      if (previousType === VoteType.UP) {
        await manager.decrement(Answer, { id: answerId }, 'upvotes', 1);
        await manager.increment(Answer, { id: answerId }, 'downvotes', 1);
      } else {
        await manager.decrement(Answer, { id: answerId }, 'downvotes', 1);
        await manager.increment(Answer, { id: answerId }, 'upvotes', 1);
      }

      shouldNotify = true;

      const updated = await manager.findOne(Answer, {
        where: { id: answerId },
      });
      if (!updated) throw new NotFoundException('Answer not found after vote');

      return { upvotes: updated.upvotes, downvotes: updated.downvotes };
    });

    if (shouldNotify && recipientId && questionId) {
      await this.notificationService.notifyAnswerVote({
        recipientId,
        actorId: userId,
        actorUsername,
        answerId,
        questionId,
        voteType: type,
      });
    }

    return result;
  }

  // ------------------ ACCEPT ANSWER ------------------
  async acceptAnswer(userId: number, answerId: number): Promise<void> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['author', 'question', 'question.author'],
    });
    if (!answer) throw new NotFoundException('Answer not found');

    if (answer.question.author.id !== userId) {
      throw new ForbiddenException(
        'Only the question author can accept an answer',
      );
    }

    const wasAccepted = answer.isAccepted;
    answer.isAccepted = !answer.isAccepted;
    await this.answerRepository.save(answer);

    if (!wasAccepted && answer.isAccepted) {
      await this.notificationService.notifyAnswerAccepted({
        recipientId: answer.author.id,
        actorId: userId,
        actorUsername: answer.question.author.username,
        answerId: answer.id,
        questionId: answer.question.id,
      });
    }
  }

  // ------------------ DELETE ANSWER ------------------
  async remove(userId: number, answerId: number): Promise<void> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['author'],
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    if (answer.author.id !== userId) {
      throw new ForbiddenException('You can only delete your own answers');
    }

    await this.answerRepository.delete({ id: answerId });
  }

  // ------------------ MAP ANSWER TO RESPONSE DTO ------------------
  private mapAnswerToDto(
    answer: Answer,
    currentUserId?: number,
  ): AnswerResponseDto {
    const dto = plainToInstance(AnswerResponseDto, answer, {
      excludeExtraneousValues: true,
    });
    dto.userVote = currentUserId
      ? (answer.votes?.find((v) => v.user.id === currentUserId)?.type ?? null)
      : null;
    return dto;
  }
}
