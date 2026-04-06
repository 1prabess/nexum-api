import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post } from 'src/post/entities/post.entity';
import { Question } from 'src/question/entities/question.entity';
import { Community } from 'src/community/entities/community.entity';
import { User } from 'src/user/user.entity';
import { tokenize, computeTF } from './utils/tfidf.utils';
import { CommunityVisibility } from 'src/community/enums/community-visibility.enum';

@Injectable()
export class SearchService implements OnModuleInit {
  private totalDocs = 0;
  private termDocFreq = new Map<string, number>();
  private invertedIndex = new Map<string, Set<number>>();

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.rebuildIndexAndStats();
  }

  // ------------------ COMPUTE AND STORE VECTOR ------------------
  async computeAndStoreVector<
    T extends {
      id: number;
      title: string;
      searchContent: string;
      searchVector?: Record<string, number>;
      tags?: { name: string }[];
    },
  >(entity: T, repository: Repository<T>): Promise<void> {
    let isNew = !entity.id;
    let oldTf: Record<string, number> = {};

    if (!isNew) {
      const oldEntity = await repository.findOne({
        where: { id: entity.id } as any,
        select: ['id', 'searchVector'],
      });
      if (oldEntity) {
        oldTf = oldEntity.searchVector || {};
      } else {
        isNew = true;
      }
    }

    if (!isNew) {
      this.removeFromIndex(oldTf, entity.id);
    }

    const titleText = entity.title || '';
    const contentText = entity.searchContent?.trim() || '';

    const TITLE_WEIGHT = 3;
    const TAG_WEIGHT = 2;
    const titleTokens = tokenize(titleText);
    const contentTokens = tokenize(contentText);
    const tagTokens = entity.tags?.flatMap((tag) => tokenize(tag.name)) || [];

    const allTokens = [
      ...titleTokens.flatMap((t) => Array(TITLE_WEIGHT).fill(t)),
      ...tagTokens.flatMap((t) => Array(TAG_WEIGHT).fill(t)),
      ...contentTokens,
    ];

    if (allTokens.length === 0) {
      entity.searchVector = {};
    } else {
      entity.searchVector = computeTF(allTokens);
    }

    await repository.save(entity as any);
    this.addToIndex(entity.searchVector || {}, entity.id);

    if (isNew) {
      this.totalDocs++;
    }
  }

  async updatePostVector(post: Post) {
    return this.computeAndStoreVector(post, this.postRepository);
  }

  async updateQuestionVector(question: Question) {
    return this.computeAndStoreVector(question, this.questionRepository);
  }

  // ------------------ REBUILD INDEX AND STATS ------------------
  private async rebuildIndexAndStats(): Promise<void> {
    const [posts, questions] = await Promise.all([
      this.postRepository.find({ select: ['id', 'searchVector'] }),
      this.questionRepository.find({ select: ['id', 'searchVector'] }),
    ]);

    const allDocs = [
      ...posts.map((p) => ({ ...p, type: 'post' as const })),
      ...questions.map((q) => ({ ...q, type: 'question' as const })),
    ];

    this.totalDocs = allDocs.length;
    this.termDocFreq.clear();
    this.invertedIndex.clear();

    for (const doc of allDocs) {
      const tf = doc.searchVector ?? {};
      this.addToIndex(tf, doc.id);
    }
  }

  // ------------------ SEARCH CONTENT ------------------
  // Includes visibility checks for private community content.
  async search(
    query: string,
    topN = 20,
    currentUserId?: number,
  ): Promise<any[]> {
    const tokens = tokenize(query);
    const rawTokens = this.tokenizeRaw(query);
    if (tokens.length === 0 && rawTokens.length === 0) return [];

    const queryTf = computeTF(tokens);
    if (Object.keys(queryTf).length === 0 && rawTokens.length === 0) return [];

    const candidateIds = this.getCandidateDocIds(tokens);

    // Load minimal candidates with community visibility info.
    const [postCandidates, questionCandidates] = candidateIds.size
      ? await Promise.all([
          this.postRepository.find({
            where: { id: In([...candidateIds]) },
            select: ['id', 'searchVector', 'title', 'community'],
            relations: ['community'],
          }),
          this.questionRepository.find({
            where: { id: In([...candidateIds]) },
            select: ['id', 'searchVector', 'title', 'community'],
            relations: ['community'],
          }),
        ])
      : [[], []];

    // Filter out private content the user cannot access.
    const allowedPostIds = new Set<number>();
    const allowedQuestionIds = new Set<number>();

    for (const post of postCandidates) {
      if (
        !post.community ||
        post.community.visibility === CommunityVisibility.PUBLIC ||
        (currentUserId &&
          (await this.isUserMemberOfCommunity(
            post.community.id,
            currentUserId,
          )))
      ) {
        allowedPostIds.add(post.id);
      }
    }

    for (const q of questionCandidates) {
      if (
        !q.community ||
        q.community.visibility === CommunityVisibility.PUBLIC ||
        (currentUserId &&
          (await this.isUserMemberOfCommunity(q.community.id, currentUserId)))
      ) {
        allowedQuestionIds.add(q.id);
      }
    }

    // Keep only allowed candidates.
    const allowedCandidates = candidateIds.size
      ? [
          ...postCandidates
            .filter((p) => allowedPostIds.has(p.id))
            .map((p) => ({ ...p, type: 'post' as const })),
          ...questionCandidates
            .filter((q) => allowedQuestionIds.has(q.id))
            .map((q) => ({ ...q, type: 'question' as const })),
        ]
      : [];

    // Score allowed candidates.
    const scored = allowedCandidates.length
      ? allowedCandidates
          .map((doc) => {
            let score = this.cosineSimilarity(queryTf, doc.searchVector || {});

            const titleLower = doc.title.toLowerCase();
            for (const t of rawTokens) {
              if (titleLower.includes(t)) score += 0.6;
            }

            return { id: doc.id, type: doc.type, score };
          })
          .filter((r) => r.score > 0.005)
          .sort((a, b) => b.score - a.score)
          .slice(0, topN)
      : [];

    // Fetch full entities only for top results.
    const postIds = scored.filter((s) => s.type === 'post').map((s) => s.id);
    const questionIds = scored
      .filter((s) => s.type === 'question')
      .map((s) => s.id);

    const [fullPosts, fullQuestions] = await Promise.all([
      postIds.length
        ? this.postRepository.find({
            where: { id: In(postIds) },
            relations: ['author', 'tags', 'community'],
          })
        : Promise.resolve([]),
      questionIds.length
        ? this.questionRepository.find({
            where: { id: In(questionIds) },
            relations: ['author', 'tags', 'community'],
          })
        : Promise.resolve([]),
    ]);

    // Combine and sort by score.
    const results = [
      ...fullPosts.map((p) => ({ ...p, type: 'post' as const })),
      ...fullQuestions.map((q) => ({ ...q, type: 'question' as const })),
    ];

    results.sort((a, b) => {
      const sa =
        scored.find((s) => s.id === a.id && s.type === a.type)?.score ?? 0;
      const sb =
        scored.find((s) => s.id === b.id && s.type === b.type)?.score ?? 0;
      return sb - sa;
    });

    const communityResults = await this.searchCommunities(
      query,
      rawTokens,
      topN,
      currentUserId,
    );

    // Format response payload.
    const contentResults = results.map((item) => {
      const base = {
        id: item.id,
        title: item.title,
        type: item.type,
        author: item.author
          ? {
              id: item.author.id,
              username: item.author.username,
              fullName: item.author.fullName,
              avatar: item.author.avatar,
            }
          : null,
        tags: item.tags?.map((t) => ({ id: t.id, name: t.name })) ?? [],
        community: item.community
          ? {
              id: item.community.id,
              name: item.community.name,
              avatar: item.community.avatar,
              visibility: item.community.visibility,
            }
          : null,
        createdAt: item.createdAt,
        score:
          scored.find((s) => s.id === item.id && s.type === item.type)?.score ??
          0,
      };

      if (item.type === 'question') {
        return { ...base, urgency: (item as any).urgency };
      }

      return base;
    });

    const userResults = await this.searchUsers(
      query,
      rawTokens,
      topN,
      currentUserId,
    );

    return [...contentResults, ...communityResults, ...userResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }

  // ------------------ CALCULATE IDF ------------------
  private getIdf(term: string): number {
    const df = this.termDocFreq.get(term) || 0;
    return Math.log((this.totalDocs + 1) / (df + 1)) + 1;
  }

  // ------------------ GET CANDIDATE DOCUMENT IDS ------------------
  private getCandidateDocIds(tokens: string[]): Set<number> {
    const ids = new Set<number>();
    for (const token of tokens) {
      for (const [term, docSet] of this.invertedIndex.entries()) {
        if (term.startsWith(token)) {
          docSet.forEach((id) => ids.add(id));
        }
      }
    }
    return ids;
  }

  // ------------------ CALCULATE COSINE SIMILARITY ------------------
  private cosineSimilarity(
    a: Record<string, number>,
    b: Record<string, number>,
  ): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (const [term, va] of Object.entries(a)) {
      const idf = this.getIdf(term);
      if (idf <= 0) continue;
      const weightedVa = va * idf;
      normA += weightedVa ** 2;

      const vb = b[term] ?? 0;
      dot += weightedVa * (vb * idf);
    }

    for (const [term, vb] of Object.entries(b)) {
      const idf = this.getIdf(term);
      if (idf <= 0) continue;
      const weightedVb = vb * idf;
      normB += weightedVb ** 2;
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    const mag = normA * normB;
    return mag === 0 ? 0 : dot / mag;
  }

  // ------------------ ADD DOCUMENT TO INDEX ------------------
  private addToIndex(tf: Record<string, number>, docId: number): void {
    for (const [term, tfValue] of Object.entries(tf)) {
      if (tfValue > 0) {
        let docSet = this.invertedIndex.get(term);
        if (!docSet) {
          docSet = new Set();
          this.invertedIndex.set(term, docSet);
        }
        if (!docSet.has(docId)) {
          docSet.add(docId);
          this.termDocFreq.set(term, docSet.size);
        }
      }
    }
  }

  // ------------------ REMOVE DOCUMENT FROM INDEX ------------------
  private removeFromIndex(tf: Record<string, number>, docId: number): void {
    for (const [term, tfValue] of Object.entries(tf)) {
      if (tfValue > 0) {
        const docSet = this.invertedIndex.get(term);
        if (docSet && docSet.has(docId)) {
          docSet.delete(docId);
          if (docSet.size === 0) {
            this.invertedIndex.delete(term);
            this.termDocFreq.delete(term);
          } else {
            this.termDocFreq.set(term, docSet.size);
          }
        }
      }
    }
  }

  // ------------------ CHECK COMMUNITY MEMBERSHIP ------------------
  private async isUserMemberOfCommunity(
    communityId: number,
    userId: number,
  ): Promise<boolean> {
    const exists = await this.postRepository.manager
      .createQueryBuilder('community_members', 'cm')
      .where('cm.communityId = :communityId', { communityId })
      .andWhere('cm.userId = :userId', { userId })
      .getExists();

    return exists;
  }

  // ------------------ SEARCH COMMUNITIES ------------------
  private async searchCommunities(
    query: string,
    rawTokens: string[],
    topN: number,
    currentUserId?: number,
  ) {
    const communities = await this.communityRepository
      .createQueryBuilder('community')
      .leftJoinAndSelect('community.owner', 'owner')
      .where('LOWER(community.name) LIKE LOWER(:query)', {
        query: `%${query}%`,
      })
      .orWhere('LOWER(COALESCE(community.description, \'\')) LIKE LOWER(:query)', {
        query: `%${query}%`,
      })
      .orderBy('community.createdAt', 'DESC')
      .limit(topN)
      .getMany();

    const allowedCommunities: Community[] = [];

    for (const community of communities) {
      if (community.visibility === CommunityVisibility.PUBLIC) {
        allowedCommunities.push(community);
        continue;
      }

      if (
        currentUserId &&
        (await this.isUserMemberOfCommunity(community.id, currentUserId))
      ) {
        allowedCommunities.push(community);
      }
    }

    return allowedCommunities.map((community) => {
      const haystack = `${community.name} ${community.description ?? ''}`.toLowerCase();
      const score = rawTokens.reduce((acc, token) => {
        if (community.name.toLowerCase().includes(token)) return acc + 1.2;
        if (haystack.includes(token)) return acc + 0.6;
        return acc;
      }, 0);

      return {
        id: community.id,
        title: community.name,
        type: 'community' as const,
        author: community.owner
          ? { id: community.owner.id, username: community.owner.username }
          : null,
        tags: [],
        community: {
          id: community.id,
          name: community.name,
          avatar: community.avatar,
          visibility: community.visibility,
        },
        createdAt: community.createdAt,
        score,
        description: community.description ?? '',
      };
    });
  }

  // ------------------ SEARCH USERS ------------------
  private async searchUsers(
    query: string,
    rawTokens: string[],
    topN: number,
    currentUserId?: number,
  ) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) LIKE LOWER(:query)', {
        query: `%${query}%`,
      })
      .orWhere('LOWER(COALESCE(user.fullName, \'\')) LIKE LOWER(:query)', {
        query: `%${query}%`,
      })
      .orWhere('LOWER(COALESCE(user.bio, \'\')) LIKE LOWER(:query)', {
        query: `%${query}%`,
      })
      .orderBy('user.followersCount', 'DESC')
      .addOrderBy('user.createdAt', 'DESC')
      .limit(topN)
      .getMany();

    return users
      .filter((user) => user.id !== currentUserId)
      .map((user) => {
        const haystack =
          `${user.username} ${user.fullName ?? ''} ${user.bio ?? ''}`.toLowerCase();
        const score = rawTokens.reduce((acc, token) => {
          if (user.username.toLowerCase().includes(token)) return acc + 1.3;
          if ((user.fullName ?? '').toLowerCase().includes(token)) return acc + 1;
          if (haystack.includes(token)) return acc + 0.4;
          return acc;
        }, 0);

        return {
          id: user.id,
          title: user.fullName || user.username,
          type: 'user' as const,
          author: null,
          tags: [],
          community: null,
          createdAt: user.createdAt,
          score,
          description: user.bio || `@${user.username}`,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
        };
      })
      .filter((user) => user.score > 0);
  }

  // ------------------ TOKENIZE RAW QUERY ------------------
  private tokenizeRaw(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word) => word.trim())
      .filter((word) => word.length > 0);
  }
}
