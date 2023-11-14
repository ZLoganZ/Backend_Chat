import { Schema, Types, model } from 'mongoose';

const DOCUMENT_NAME = 'Key';
const COLLECTION_NAME = 'keys';

const KeyTokenSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    },
    publicKey: {
      type: String,
      required: true
    },
    privateKey: {
      type: String,
      required: true
    },
    refreshTokensUsed: {
      type: Array,
      default: []
    },
    refreshToken: {
      type: String,
      require: true
    }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME
  }
);

const KeyModel = model(DOCUMENT_NAME, KeyTokenSchema);

class Key {
  static async findByRefreshTokenUsed(refreshToken: string) {
    return await KeyModel.findOne({
      refreshTokensUsed: refreshToken
    }).lean();
  }
  static async findByRefreshToken(refreshToken: string) {
    return KeyModel.findOne({ refreshToken }).lean();
  }
  static async deleteKeyByID(userID: Types.ObjectId) {
    return await KeyModel.findOneAndDelete({ user: userID });
  }
  static async findByUserID(userID: Types.ObjectId) {
    return await KeyModel.findOne({ user: userID });
  }
  static async removeKeyByID(KeyID: Types.ObjectId) {
    return await KeyModel.findByIdAndDelete(KeyID);
  }
  static async createKeyToken(
    userID: Types.ObjectId,
    publicKey: string,
    privateKey: string,
    refreshToken: string
  ) {
    const update = {
      publicKey,
      privateKey,
      refreshTokensUsed: [] as string[],
      refreshToken
    };

    const tokens = await KeyModel.findOneAndUpdate({ user: userID }, update, { upsert: true, new: true });
    return tokens || null;
  }
}

export default Key;
