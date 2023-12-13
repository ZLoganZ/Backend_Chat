import { UploadApiResponse } from 'cloudinary';
import { Types } from 'mongoose';
import crypto from 'crypto';

import imageHandler from '../helpers/image';
import { BadRequest } from '../cores/error.response';
import { UserModel } from '../models/users';
import { IUpdateUser } from '../types';
import { getInfoData, removeUndefinedFields, updateNestedObject } from '../libs/utils';
import { selectUserArr } from '../libs/constants';

class UserService {
  static async getUser(userIDorAlias: string) {
    let user;

    if (Types.ObjectId.isValid(userIDorAlias)) {
      user = await UserModel.getUserByID(userIDorAlias);
    } else {
      user = await UserModel.getUserByAlias(userIDorAlias);
    }

    if (!user) throw new BadRequest('User is not exist');

    return getInfoData({
      fields: selectUserArr,
      object: user
    });
  }
  static async getTopCreators(page: string) {
    return await UserModel.getTopCreators(page);
  }
  static async updateUser(payload: { userID: string; updateUser: IUpdateUser }) {
    const { userID, updateUser } = payload;

    let image: string | undefined;

    const userByAlias = await UserModel.getUserByAlias(updateUser.alias);

    if (userByAlias && userByAlias._id.toString() !== userID) {
      throw new BadRequest('Alias is already exist');
    }

    if (updateUser.isChangeImage && updateUser.image) {
      const [uploadedImage, user] = await Promise.all([
        new Promise<UploadApiResponse>((resolve) => {
          imageHandler
            .unsigned_upload_stream(
              process.env.CLOUDINARY_PRESET,
              {
                folder: 'instafram/users',
                public_id: updateUser.image.originalname + '_' + crypto.randomBytes(8).toString('hex')
              },
              (error, result) => {
                if (error) throw new BadRequest(error.message);
                resolve(result as UploadApiResponse);
              }
            )
            .end(updateUser.image.buffer);
        }),
        UserModel.getUserByID(userID)
      ]);

      if (!user) throw new BadRequest('UserModel is not exist');

      user.image && imageHandler.destroy(user.image);

      image = uploadedImage.public_id;
    }

    delete updateUser.image;
    return await UserModel.updateUser(
      userID,
      updateNestedObject(removeUndefinedFields({ ...updateUser, image, alias: updateUser.alias }))
    );
  }
  static async followUser(payload: { userID: string; followID: string }) {
    const { userID, followID } = payload;

    const user = await UserModel.getUserByID(userID);

    if (!user) throw new BadRequest('UserModel is not exist');

    const followUser = await UserModel.getUserByID(followID);

    if (!followUser) throw new BadRequest('Follow user is not exist');

    if (user.following.some((id) => id.toString() === followID)) {
      await Promise.all([
        UserModel.updateUser(userID, { $pull: { following: followID } }),
        UserModel.updateUser(followID, { $pull: { followers: userID } })
      ]);
    } else {
      await Promise.all([
        UserModel.updateUser(userID, { $push: { following: followID } }),
        UserModel.updateUser(followID, { $push: { followers: userID } })
      ]);
    }

    return await UserModel.getUserByID(userID);
  }
}

export default UserService;
