import { IUserProfile } from './user-profile.interface';

export interface IPost {
  id: number;
  title: string;
  content: string;
  author: IUserProfile;
  tags: { id: number; name: string }[];
  createdAt: Date;
  updatedAt: Date;
}
