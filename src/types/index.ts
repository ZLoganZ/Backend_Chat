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

export interface IUser {
  _id: string;
  name: string;
  alias: string;
  email: string;
  image: string;
  bio: string;
}

export interface IPost {
  _id: string;
  content: string;
  image: string;
  location: string;
  tags: string[];
  likes: IUser[];
  saves: string[];
  creator: IUser;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateUser {
  name: string;
  bio: string;
  alias: string;
  image: Express.Multer.File;
  isChangeImage: boolean;
}

export interface INewPost {
  content: string;
  creator: string;
  tags: string;
  image: Express.Multer.File;
  location: string;
}

export interface IUpdatePost {
  postID: string;
  content: string;
  image: Express.Multer.File;
  isChangeImage: boolean;
  location?: string;
  tags?: string;
}

export class CustomError extends Error {
  code: number;

  constructor(message?: string, code: number = 500) {
    super(message);
    this.code = code;
  }
}
