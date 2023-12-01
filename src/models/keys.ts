import { Schema, Types, model } from 'mongoose';

const DOCUMENT_NAME = 'Key';
const COLLECTION_NAME = 'keys';

const KeyTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
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
    collection: COLLECTION_NAME,
    statics: {
      async findByRefreshTokenUsed(refreshToken: string) {
        return await this.findOne({
          refreshTokensUsed: refreshToken
        }).lean();
      },
      async findByRefreshToken(refreshToken: string) {
        return await this.findOne({ refreshToken }).lean();
      },
      async deleteKeyByID(keyID: string | Types.ObjectId) {
        return await this.findOneAndDelete({ _id: keyID }).lean();
      },
      async findByUserID(userID: string | Types.ObjectId) {
        return await this.findOne({ user: userID }).lean();
      },
      async removeKeyByID(keyID: string | Types.ObjectId) {
        return await this.findByIdAndDelete(keyID).lean();
      },
      async createKeyToken(
        userID: string | Types.ObjectId,
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

        const tokens = await this.findOneAndUpdate({ user: userID }, update, {
          upsert: true,
          new: true
        }).lean();
        return tokens;
      }
    }
  }
);

export const KeyModel = model(DOCUMENT_NAME, KeyTokenSchema);
