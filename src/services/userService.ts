import { UploadApiResponse } from 'cloudinary';
import { Types } from 'mongoose';
import crypto from 'crypto';

import imageHandler from 'helpers/image';
import { BadRequest } from 'cores/error.response';
import { UserModel } from 'models/users';
import { IUpdateUser } from 'types';
import { getInfoData, removeUndefinedFields, updateNestedObject } from 'utils';
import { selectUserArr } from 'utils/constants';

class UserService {
  static async getUserByID(userID: string) {
    const user = await UserModel.getUserByID(userID);

    return getInfoData({
      fields: selectUserArr,
      object: user
    });
  }
  static async getTopCreators() {
    return await UserModel.getTopCreators();
  }
  static async updateUser(payload: { userID: string; updateUser: IUpdateUser }) {
    const { userID, updateUser } = payload;

    let image: string | undefined;

    const userByAlias = await UserModel.getUserByAlias(updateUser.alias);

    if (userByAlias && userByAlias._id.toString() !== userID) {
      throw new BadRequest('Alias is already exist');
    }

    if (updateUser.isChangeImage && updateUser.image) {
      const uploadedImage: UploadApiResponse = await new Promise((resolve) => {
        imageHandler
          .unsigned_upload_stream(
            process.env.CLOUDINARY_PRESET as string,
            {
              folder: 'instafram/users',
              public_id: updateUser.image.originalname + '_' + crypto.randomBytes(8).toString('hex')
            },
            (error, result) => {
              if (error) throw new BadRequest(error.message);
              resolve(result);
            }
          )
          .end(updateUser.image.buffer);
      });

      const user = await UserModel.getUserByID(userID);

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
      await UserModel.updateUser(userID, { $pull: { following: followID } });
      await UserModel.updateUser(followID, { $pull: { followers: userID } });
    } else {
      await UserModel.updateUser(userID, { $push: { following: followID } });
      await UserModel.updateUser(followID, { $push: { followers: userID } });
    }

    return await UserModel.getUserByID(userID);
  }
}

export default UserService;
