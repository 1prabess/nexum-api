import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from '../dtos/create-post.dto';
import { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { TagService } from 'src/tag/providers/tag.service';
import { paginate } from 'src/common/utils/pagination';
import { IPost } from 'src/common/interfaces/post.interface';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly tagService: TagService,
  ) {}

  async create(
    user: ICurrentUser,
    createPostDto: CreatePostDto,
  ): Promise<void> {
    if (createPostDto.tagIds.length < 1) {
      throw new BadRequestException('At least one tag is required');
    }

    // Fetch tags
    const tags = await this.tagService.findByIds(createPostDto.tagIds);

    // Throw exception if any of the tags sent does not exist
    if (tags.length !== createPostDto.tagIds.length) {
      throw new BadRequestException('One or more tags are invalid');
    }

    // Create the post attaching the authenticated current user and tags
    const post = this.postRepository.create({
      title: createPostDto.title,
      content: createPostDto.content,
      author: { id: user.id },
      tags,
    });

    await this.postRepository.save(post);
  }

  async findAll({ page, limit }: { page: number; limit: number }) {
    // Fetch posts along with total
    const [posts, total] = await this.postRepository.findAndCount({
      relations: ['author', 'tags'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Prepare items for pagination
    const items: IPost[] = posts.map(this.mapPostToIPost);

    // Paginate
    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/posts`,
    });
  }

  async findAllByUser({
    userId,
    page,
    limit,
  }: {
    userId: number;
    page: number;
    limit: number;
  }) {
    // Fetch posts of the user
    const [posts, total] = await this.postRepository.findAndCount({
      where: {
        author: { id: userId },
      },
      relations: ['author', 'tags'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Prepare items for pagination
    const items: IPost[] = posts.map(this.mapPostToIPost);

    // Paginate
    return paginate({
      items,
      totalItems: total,
      currentPage: page,
      limit,
      route: `${process.env.API_URL}/posts`,
    });
  }

  async find(postId: number): Promise<IPost> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['author', 'tags'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.mapPostToIPost(post);
  }

  private mapPostToIPost = (post: Post): IPost => {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        id: post.author.id,
        username: post.author.username,
        fullName: post.author.fullName,
        bio: post.author.bio,
        coverPhoto: post.author.coverPhoto,
        avatar: post.author.avatar,
        email: post.author.email,
        followersCount: post.author.followersCount,
        followingCount: post.author.followingCount,
        createdAt: post.author.createdAt,
        updatedAt: post.author.updatedAt,
      },
      tags: post.tags.map((t) => ({ id: t.id, name: t.name })),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  };
}
