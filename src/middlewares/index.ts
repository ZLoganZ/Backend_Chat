import { merge } from 'lodash';
import path from 'path';
import { Response, NextFunction } from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';

import { KeyModel } from '../models/keys';
import { RequestWithUser } from '../types';
import { Unauthorized } from '../cores/error.response';
import { HEADER } from '../libs/constants';
import { asyncHandler } from '../libs/utils';

export const Authentication = asyncHandler(async (req: RequestWithUser, _: Response, next: NextFunction) => {
  try {
    const userID = req.headers[HEADER.CLIENT_ID];
    if (!userID) throw new Unauthorized('User is not found');

    const keyStore = await KeyModel.findByUserID(userID.toString());
    if (!keyStore) throw new Unauthorized('User is not exist');

    const accessToken = req.headers[HEADER.ACCESSTOKEN] as string;
    const refreshToken = req.headers[HEADER.REFRESHTOKEN] as string;

    if (!accessToken || !refreshToken) throw new Unauthorized('Token is not found');

    let decode: jwt.JwtPayload;

    jwt.verify(accessToken, keyStore.publicKey, (err, decoded) => {
      if (err?.message.includes('expired')) {
        jwt.verify(refreshToken, keyStore.privateKey, (err, decoded) => {
          if (err?.message.includes('expired')) throw new Unauthorized('Token is expired');
          if (err) throw new Unauthorized('Token is invalid');

          decode = decoded as jwt.JwtPayload;
        });
      } else {
        if (err) throw new Unauthorized('Token is invalid');

        decode = decoded as jwt.JwtPayload;
      }
    });

    const user = { user: { accessToken, refreshToken, ...decode } };

    merge(req, user);

    return next();
  } catch (error) {
    return next(error);
  }
});

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
