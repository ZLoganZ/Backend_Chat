import { merge } from 'lodash';
import path from 'path';
import { Response, NextFunction } from 'express';
import multer from 'multer';

import User from 'models/users';
import Key from 'models/keys';
import { RequestWithUser } from 'types';
import { NotFound, Unauthorized } from 'cores/error.response';

export const Authentication = async (req: RequestWithUser, _: Response, next: NextFunction) => {
  try {
    const accessToken = req.cookies.accessToken as string;
    const refreshToken = req.cookies.refreshToken as string;
    if (!accessToken || !refreshToken) throw new NotFound('Token is not found');

    const key = await Key.findByRefreshToken(refreshToken);
    if (!key) throw new Unauthorized('Token is not exist');

    const currentUser = await User.getUserByID(key.user as unknown as string);

    const user = { user: { ...currentUser, accessToken, refreshToken, _id: currentUser._id.toString() } };

    merge(req, user);

    return next();
  } catch (error) {
    return next(error);
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(_, file, callback) {
    const fileExts = ['.png', '.jpg', '.jpeg', '.gif'];

    const isAllowedExt = fileExts.includes(path.extname(file.originalname.toLowerCase()));

    const isAllowedMimeType = file.mimetype.startsWith('image/');

    if (isAllowedExt && isAllowedMimeType) {
      return callback(null, true);
    } else {
      callback(new Error('Error: File type not allowed!'));
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB
  }
});
