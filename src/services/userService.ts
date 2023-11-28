import { UploadApiResponse } from 'cloudinary';
import crypto from 'crypto';

import imageHandler from 'helpers/image';
import { BadRequest } from 'cores/error.response';
import User from 'models/users';
import { IUpdateUser } from 'types';

class UserService {
  static async getUserByID(userID: string) {
    return await User.getUserByID(userID);
  }
  static async getTopCreators() {
    return await User.getTopCreators();
  }
  static async updateUser(userID: string, payload: IUpdateUser) {
    let image: string | undefined;

    const userByAlias = await User.getUserByAlias(payload.alias);

    if (userByAlias && userByAlias._id.toString() !== userID) {
      throw new BadRequest('Alias is already exist');
    }

    if (payload.isChangeImage && payload.image) {
      const uploadedImage: UploadApiResponse = await new Promise((resolve) => {
        imageHandler
          .unsigned_upload_stream(
            process.env.CLOUDINARY_PRESET as string,
            {
              folder: 'instafram/users',
              public_id: payload.image.originalname + '_' + crypto.randomBytes(8).toString('hex')
            },
            (error, result) => {
              if (error) throw new BadRequest(error.message);
              resolve(result);
            }
          )
          .end(payload.image.buffer);
      });

      const user = await User.getUserByID(userID);

      if (!user) throw new BadRequest('User is not exist');

      user.image && imageHandler.destroy(user.image);

      image = uploadedImage.public_id;
    }

    delete payload.image;
    return await User.updateUser(userID, { ...payload, image, alias: payload.alias });
  }
}

export default UserService;
