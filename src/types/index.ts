import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    accessToken: string;
    refreshToken: string;
  };
}
