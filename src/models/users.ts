import { Schema, model, Types } from 'mongoose';
import { IUser } from 'types';
import { getSelectData } from 'utils';
import { selectUserArr } from 'utils/constants';

const DOCUMENT_NAME = 'User';
const COLLECTION_NAME = 'users';

const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true, unique: true },
    password: { type: String, required: true, select: false },
    posts: {
      type: [ObjectId],
      ref: 'Post',
      default: []
    },
    followers: {
      type: [ObjectId],
      ref: 'User',
      default: []
    },
    following: {
      type: [ObjectId],
      ref: 'User',
      default: []
    },
    bio: {
      type: String,
      default: null
    },
    alias: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
      unique: true
    },
    image: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
    methods: {
      async getFollowers() {
        return await model(DOCUMENT_NAME)
          .find({ _id: { $in: this.followers } })
          .lean();
      },
      async getFollowing() {
        return await model(DOCUMENT_NAME)
          .find({ _id: { $in: this.following } })
          .lean();
      }
    },
    statics: {
      async getUsers() {
        return this.find().lean();
      },
      async getUserByEmail(email: string) {
        return await this.findOne({ email }).select('+password').lean();
      },
      async getUserByAlias(alias: string) {
        return await this.findOne({ alias }).lean();
      },
      async getUserByID(id: string | Types.ObjectId) {
        return await this.findById(id).lean();
      },
      async createUser(values: Record<string, any>) {
        return await this.create(values);
      },
      async deleteUser(id: string | Types.ObjectId) {
        return await this.findByIdAndDelete(id).lean();
      },
      async updateUser(id: string | Types.ObjectId, values: Record<string, any>) {
        return await this.findByIdAndUpdate(id, values, { new: true }).lean();
      },
      async getTopCreators() {
        return await this.aggregate<IUser>([
          {
            $project: {
              ...getSelectData(selectUserArr),
              postCount: { $size: '$posts' }
            }
          },
          {
            $sort: { postCount: -1 }
          },
          {
            $limit: 12
          }
        ]);
      }
    }
  }
);

UserSchema.index({ name: 'text', alias: 'text' });

export const UserModel = model(DOCUMENT_NAME, UserSchema);
