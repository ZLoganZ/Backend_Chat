import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    _id: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken: string;
  };
}

export type IUser = {
  _id: string;
  name: string;
  email: string;
  alias: string;
  image: string;
  bio: string;
  posts: string[];
  followers: IUser[];
  following: IUser[];
  createdAt: Date;
  updatedAt: Date;
};

export type IVisibility = 'Public' | 'Private' | 'Followers';

export type IPost = {
  _id: string;
  content: string;
  image: string;
  location: string;
  visibility: IVisibility;
  tags: string[];
  likes: IUser[];
  saves: string[];
  creator: IUser;
  createdAt: string;
  updatedAt: string;
};

export type IUpdateUser = {
  name: string;
  bio: string;
  alias: string;
  image: Express.Multer.File;
  isChangeImage: boolean;
};

export type INewPost = {
  content: string;
  creator: string;
  visibility: IVisibility;
  tags: string;
  image: Express.Multer.File;
  location: string;
};

export type IUpdatePost = {
  postID: string;
  content: string;
  visibility: IVisibility;
  image: Express.Multer.File;
  isChangeImage: boolean;
  location?: string;
  tags?: string;
};

export type IComment = {
  _id: string;
  content: string;
  user: IUser;
  post: IPost;
  likes: IUser[];
  isChild: boolean;
  replies: IComment[];
  createdAt: string;
  updatedAt: string;
};

export class CustomError extends Error {
  code: number;

  constructor(message?: string, code: number = 500) {
    super(message);
    this.code = code;
  }
}

export type FILTERS = 'All' | 'Today' | 'Yesterday' | 'Week' | 'Month' | 'Year';
