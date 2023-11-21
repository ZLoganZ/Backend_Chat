import { Response, NextFunction } from 'express';
import { get, merge } from 'lodash';

import User from 'models/users';
import { RequestWithUser } from 'types';
import { NotFound, Unauthorized } from 'cores/error.response';

export const Authentication = async (req: RequestWithUser, _: Response, next: NextFunction) => {
  try {
    const accessToken = get(req, 'cookies.accessToken');
    const refreshToken = get(req, 'cookies.refreshToken');
    if (!accessToken || !refreshToken) throw new Unauthorized('Token is not exist');

    const user = await User.getUserByID(accessToken);
    if (!user) throw new NotFound('User not found');

    merge(req, { ...user, accessToken, refreshToken });
    return next();
  } catch (error) {
    return next(error);
  }
};
