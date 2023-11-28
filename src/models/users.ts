import { Schema, model, Types } from 'mongoose';
import { getSelectData } from 'utils';
import { selectPostArr, selectUserArr } from 'utils/constants';

const DOCUMENT_NAME = 'User';
const COLLECTION_NAME = 'users';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, index: true, unique: true },
    password: { type: String, required: true, select: false },
    posts: {
      type: [Types.ObjectId],
      ref: 'Post',
      default: []
    },
    bio: {
      type: String,
      default: null
    },
    alias: {
      type: String,
      required: true,
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
    collection: COLLECTION_NAME
  }
);

const UserModel = model(DOCUMENT_NAME, UserSchema);

class User {
  static async getUsers() {
    return UserModel.find().lean();
  }
  static async getUserByEmail(email: string) {
    return await UserModel.findOne({ email }).select('+password').lean();
  }
  static async getUserByAlias(alias: string) {
    return await UserModel.findOne({ alias }).lean();
  }
  static async getUserByID(id: string) {
    return await UserModel.findById(id).lean();
  }
  static async createUser(values: Record<string, any>) {
    return await UserModel.create(values);
  }
  static async deleteUser(id: string) {
    return await UserModel.findByIdAndDelete(id).lean();
  }
  static async updateUser(id: string, values: Record<string, any>) {
    return await UserModel.findByIdAndUpdate(id, values, { new: true }).lean();
  }
  static async getTopCreators() {
    return await UserModel.aggregate([
      // {
      //   $lookup: {
      //     from: 'posts',
      //     let: { posts: '$posts' },
      //     pipeline: [
      //       { $match: { $expr: { $in: ['$_id', '$$posts'] } } },
      //       { $project: getSelectData(selectPostArr) }
      //     ],
      //     as: 'posts'
      //   }
      // },
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

export default User;
