export interface CommentResponse {
  id: number;
  content: string;
  createdAt: Date;
  author: {
    id: number;
    username: string;
    avatar: string | undefined;
  };
  replies: CommentResponse[];
}
