import { Schema, Types, model } from 'mongoose';

const DOCUMENT_NAME = 'Key';
const COLLECTION_NAME = 'keys';

const ObjectId = Schema.Types.ObjectId;

const KeyTokenSchema = new Schema(
  {
    user: {
      type: ObjectId,
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
      type: [String],
      index: true,
      default: []
    },
    refreshToken: {
      type: String || null,
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
      async findByUserID(userID: string | Types.ObjectId) {
        return await this.findOne({ user: userID }).lean();
      },
      async removeRefreshToken(keyID: string | Types.ObjectId, refreshToken: string) {
        return await this.findByIdAndUpdate(
          keyID,
          { $push: { refreshTokensUsed: refreshToken }, refreshToken: null },
          { new: true }
        ).lean();
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
