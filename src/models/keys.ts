import { Schema, Types, model } from 'mongoose';

const DOCUMENT_NAME = 'Key';
const COLLECTION_NAME = 'keys';

const KeyTokenSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User',
      index: true,
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
    return await KeyModel.findOne({ refreshToken }).lean();
  }
  static async deleteKeyByID(KeyID: string) {
    return await KeyModel.findOneAndDelete({ _id: KeyID }).lean();
  }
  static async findByUserID(userID: string) {
    return await KeyModel.findOne({ user: userID }).lean();
  }
  static async removeKeyByID(KeyID: string) {
    return await KeyModel.findByIdAndDelete(KeyID).lean();
  }
  static async createKeyToken(userID: string, publicKey: string, privateKey: string, refreshToken: string) {
    const update = {
      publicKey,
      privateKey,
      refreshTokensUsed: [] as string[],
      refreshToken
    };

    const tokens = await KeyModel.findOneAndUpdate({ user: userID }, update, {
      upsert: true,
      new: true
    }).lean();
    return tokens;
  }
}

export default Key;
