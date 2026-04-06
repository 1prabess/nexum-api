import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../post/entities/post.entity';
import { PostVote } from '../post/entities/post-vote.entity';
import { Tag } from '../tag/tag.entity';
import { VoteType } from '../common/enums/vote-type.enum';
import { plainToInstance } from 'class-transformer';
import { PostResponseDto } from 'src/common/dtos/post-response.dto';
import { Question } from 'src/question/entities/question.entity';
import { QuestionResponseDto } from 'src/common/dtos/question-response.dto';
import { QuestionVote } from 'src/question/entities/question-vote.entity';
import { Community } from 'src/community/entities/community.entity';
import { CommunityMember } from 'src/community/entities/community-member.entity';
import { CommunityResponseDto } from 'src/community/dtos/community-response.dto';
import { CommunityVisibility } from 'src/community/enums/community-visibility.enum';

@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,

    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private readonly communityMemberRepository: Repository<CommunityMember>,
    @InjectRepository(PostVote)
    private readonly postVoteRepository: Repository<PostVote>,
    @InjectRepository(QuestionVote)
    private readonly questionVoteRepository: Repository<QuestionVote>,
  ) {}

  // ------------------ GET RECOMMENDED POSTS ------------------
  async getRecommendedPosts(
    userId: number,
    limit = 5,
  ): Promise<PostResponseDto[]> {
    // Step 1: Find top 3 tags the user has upvoted
    const topTags = await this.tagRepository
      .createQueryBuilder('tag')
      .innerJoin('tag.posts', 'post')
      .innerJoin('post.votes', 'vote')
      .where('vote.userId = :userId', { userId })
      .andWhere('vote.type = :type', { type: VoteType.UP })
      .select('tag.id', 'id')
      .addSelect('COUNT(tag.id)', 'count')
      .groupBy('tag.id')
      .orderBy('count', 'DESC')
      .limit(3)
      .getRawMany();

    if (!topTags.length) return []; // no voting history

    const tagScoreMap = new Map<number, number>();
    for (const tag of topTags) {
      const id = Number(tag.id);
      const score = Number(tag.count) || 0;
      tagScoreMap.set(id, score);
    }
    const tagIds = Array.from(tagScoreMap.keys());

    // Step 2: Fetch candidate posts with top tags, excluding posts already voted by the user
    const candidates = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect(
        'post.votes',
        'votes',
        'votes.userId = :userId',
        { userId },
      )
      .leftJoinAndSelect('post.community', 'community') // join community
      .loadRelationCountAndMap('post.commentCount', 'post.comments')
      .innerJoin('post.tags', 'targetTags', 'targetTags.id IN (:...tagIds)', {
        tagIds,
      })
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('v.postId')
          .from(PostVote, 'v')
          .where('v.userId = :userId')
          .getQuery();
        return 'post.id NOT IN ' + subQuery;
      })
      .andWhere(
        '(community.id IS NULL OR community.visibility = :visibility)',
        {
          visibility: 'PUBLIC',
        },
      )
      .setParameter('userId', userId)
      .orderBy('post.createdAt', 'DESC')
      .limit(Math.max(limit * 8, 40))
      .getMany();

    // Step 3: Score by tag overlap to prioritize stronger matches.
    const rankedPosts = candidates
      .filter((post) => post.author && post.tags)
      .map((post) => {
        const matchedTags = post.tags.filter((tag) => tagScoreMap.has(tag.id));
        const matchCount = matchedTags.length;
        const matchScore = matchedTags.reduce(
          (sum, tag) => sum + (tagScoreMap.get(tag.id) ?? 0),
          0,
        );

        return { post, matchCount, matchScore };
      })
      .filter((entry) => entry.matchCount > 0)
      .sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return (
          new Date(b.post.createdAt).getTime() -
          new Date(a.post.createdAt).getTime()
        );
      })
      .slice(0, limit)
      .map((entry) => entry.post);

    // Step 4: Map to DTO
    return plainToInstance(
      PostResponseDto,
      rankedPosts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        upvotes: post.upvotes ?? 0,
        downvotes: post.downvotes ?? 0,
        userVote: post.votes?.[0]?.type ?? null,
        author: {
          id: post.author.id,
          username: post.author.username,
          fullName: post.author.fullName,
          avatar: post.author.avatar,
        },
        tags: post.tags.map((t) => ({
          id: t.id,
          name: t.name,
        })),
        commentCount: (post as any).commentCount ?? 0,
        community: post.community
          ? {
              id: post.community.id,
              name: post.community.name,
              avatar: post.community.avatar,
              visibility: post.community.visibility,
            }
          : null,
      })),
      { excludeExtraneousValues: true },
    );
  }

  // ------------------ GET RECOMMENDED QUESTIONS ------------------
  async getRecommendedQuestions(
    userId: number,
    limit = 5,
  ): Promise<QuestionResponseDto[]> {
    // Step 1: Find top 3 tags the user has upvoted
    const topTags = await this.tagRepository
      .createQueryBuilder('tag')
      .innerJoin('tag.questions', 'question')
      .innerJoin('question.votes', 'vote')
      .where('vote.userId = :userId', { userId })
      .andWhere('vote.type = :type', { type: VoteType.UP })
      .select('tag.id', 'id')
      .addSelect('COUNT(tag.id)', 'count')
      .groupBy('tag.id')
      .orderBy('count', 'DESC')
      .limit(3)
      .getRawMany();

    if (!topTags.length) return []; // No voting history

    const tagScoreMap = new Map<number, number>();
    for (const tag of topTags) {
      const id = Number(tag.id);
      const score = Number(tag.count) || 0;
      tagScoreMap.set(id, score);
    }
    const tagIds = Array.from(tagScoreMap.keys());

    // Step 2: Fetch candidate questions with top tags, excluding questions already voted by the user
    const candidates = await this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.tags', 'tags')
      .leftJoinAndSelect(
        'question.votes',
        'votes',
        'votes.userId = :userId',
        { userId },
      )
      .leftJoinAndSelect('question.community', 'community')
      .loadRelationCountAndMap('question.answerCount', 'question.answers')
      .innerJoin(
        'question.tags',
        'targetTags',
        'targetTags.id IN (:...tagIds)',
        { tagIds },
      )
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('v.questionId')
          .from(QuestionVote, 'v')
          .where('v.userId = :userId')
          .getQuery();
        return 'question.id NOT IN ' + subQuery;
      })
      .andWhere(
        '(community.id IS NULL OR community.visibility = :visibility)',
        {
          visibility: 'PUBLIC',
        },
      )
      .setParameter('userId', userId)
      .orderBy('question.createdAt', 'DESC')
      .limit(Math.max(limit * 8, 40))
      .getMany();

    // Step 3: Score by tag overlap to prioritize stronger matches.
    const rankedQuestions = candidates
      .filter((q) => q.author && q.tags)
      .map((question) => {
        const matchedTags = question.tags.filter((tag) =>
          tagScoreMap.has(tag.id),
        );
        const matchCount = matchedTags.length;
        const matchScore = matchedTags.reduce(
          (sum, tag) => sum + (tagScoreMap.get(tag.id) ?? 0),
          0,
        );

        return { question, matchCount, matchScore };
      })
      .filter((entry) => entry.matchCount > 0)
      .sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return (
          new Date(b.question.createdAt).getTime() -
          new Date(a.question.createdAt).getTime()
        );
      })
      .slice(0, limit)
      .map((entry) => entry.question);

    // Step 4: Map to DTO
    return plainToInstance(
      QuestionResponseDto,
      rankedQuestions.map((q) => ({
        id: q.id,
        title: q.title,
        content: q.content,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        upvotes: q.upvotes ?? 0,
        downvotes: q.downvotes ?? 0,
        userVote: q.votes?.[0]?.type ?? null,
        author: {
          id: q.author.id,
          username: q.author.username,
          fullName: q.author.fullName,
          avatar: q.author.avatar,
        },
        tags: q.tags.map((t) => ({
          id: t.id,
          name: t.name,
        })),
        urgency: q.urgency,
        answerCount: (q as any).answerCount ?? 0,
        community: q.community
          ? {
              id: q.community.id,
              name: q.community.name,
              avatar: q.community.avatar,
              visibility: q.community.visibility,
            }
          : null,
      })),
      { excludeExtraneousValues: true },
    );
  }

  // ------------------ GET RECOMMENDED COMMUNITIES ------------------
  async getRecommendedCommunities(
    userId: number,
    limit = 6,
  ): Promise<CommunityResponseDto[]> {
    const hasUpvoteHistory = await this.hasUserUpvoteHistory(userId);
    if (!hasUpvoteHistory) {
      return [];
    }

    const tagScoreMap = await this.getUserTagPreferenceScores(userId);
    const tagIds = Array.from(tagScoreMap.keys());

    const memberCommunityRows = await this.communityMemberRepository.find({
      where: { user: { id: userId } },
      relations: ['community'],
    });
    const memberCommunityIds = memberCommunityRows.map(
      (member) => member.community.id,
    );

    if (tagIds.length === 0) {
      return [];
    }

    const matchingQuery = this.communityRepository
      .createQueryBuilder('community')
      .leftJoinAndSelect('community.owner', 'owner')
      .leftJoinAndSelect('community.tags', 'tags')
      .innerJoin('community.tags', 'targetTags', 'targetTags.id IN (:...tagIds)', {
        tagIds,
      })
      .where('community.visibility = :visibility', {
        visibility: CommunityVisibility.PUBLIC,
      });

    if (memberCommunityIds.length > 0) {
      matchingQuery.andWhere('community.id NOT IN (:...memberCommunityIds)', {
        memberCommunityIds,
      });
    }

    const candidates = await matchingQuery
      .orderBy('community.createdAt', 'DESC')
      .limit(Math.max(limit * 8, 50))
      .getMany();

    const selected = candidates
      .map((community) => {
        const matchedTags = (community.tags ?? []).filter((tag) =>
          tagScoreMap.has(tag.id),
        );

        const matchCount = matchedTags.length;
        const matchScore = matchedTags.reduce(
          (sum, tag) => sum + (tagScoreMap.get(tag.id) ?? 0),
          0,
        );

        return { community, matchCount, matchScore };
      })
      // Safety guard: keep only genuinely relevant communities.
      .filter((entry) => entry.matchCount > 0)
      .sort((a, b) => {
        // Prioritize communities matching more preferred tags first.
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return (
          new Date(b.community.createdAt).getTime() -
          new Date(a.community.createdAt).getTime()
        );
      })
      .slice(0, limit)
      .map((entry) => entry.community);

    return plainToInstance(
      CommunityResponseDto,
      selected.map((community) => ({
        ...community,
        isMember: false,
      })),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  // ------------------ GET TAG PREFERENCE SCORES ------------------
  private async getUserTagPreferenceScores(
    userId: number,
  ): Promise<Map<number, number>> {
    const topPostTags = await this.tagRepository
      .createQueryBuilder('tag')
      .innerJoin('tag.posts', 'post')
      .innerJoin('post.votes', 'vote')
      .where('vote.userId = :userId', { userId })
      .andWhere('vote.type = :type', { type: VoteType.UP })
      .select('tag.id', 'id')
      .addSelect('COUNT(tag.id)', 'count')
      .groupBy('tag.id')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    const topQuestionTags = await this.tagRepository
      .createQueryBuilder('tag')
      .innerJoin('tag.questions', 'question')
      .innerJoin('question.votes', 'vote')
      .where('vote.userId = :userId', { userId })
      .andWhere('vote.type = :type', { type: VoteType.UP })
      .select('tag.id', 'id')
      .addSelect('COUNT(tag.id)', 'count')
      .groupBy('tag.id')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    const scoreMap = new Map<number, number>();

    for (const row of topPostTags) {
      const id = Number(row.id);
      const count = Number(row.count) || 0;
      scoreMap.set(id, (scoreMap.get(id) ?? 0) + count);
    }

    for (const row of topQuestionTags) {
      const id = Number(row.id);
      const count = Number(row.count) || 0;
      scoreMap.set(id, (scoreMap.get(id) ?? 0) + count);
    }

    return scoreMap;
  }

  // ------------------ CHECK USER UPVOTE HISTORY ------------------
  private async hasUserUpvoteHistory(userId: number): Promise<boolean> {
    const [hasPostUpvote, hasQuestionUpvote] = await Promise.all([
      this.postVoteRepository.exist({
        where: {
          user: { id: userId },
          type: VoteType.UP,
        },
      }),
      this.questionVoteRepository.exist({
        where: {
          user: { id: userId },
          type: VoteType.UP,
        },
      }),
    ]);

    return hasPostUpvote || hasQuestionUpvote;
  }
}
