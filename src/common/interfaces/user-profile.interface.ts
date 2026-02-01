export interface IUserProfile {
  id: number;
  username: string;
  fullName: string;
  bio?: string;
  coverPhoto?: string;
  avatar?: string;
  email: string;
  followersCount: number;
  followingCount: number;
  createdAt: Date;
  updatedAt: Date;
}
