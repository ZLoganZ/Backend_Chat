import { Schema, model, Types } from 'mongoose';
import { selectUser } from 'utils/constants';

const DOCUMENT_NAME = 'Save';
const COLLECTION_NAME = 'saves';

const SaveSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    },
    post: {
      type: Types.ObjectId,
      ref: 'Post',
      required: true
    }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME
  }
);

SaveSchema.index({ user: 1, post: 1 }, { unique: true });

const SaveModel = model(DOCUMENT_NAME, SaveSchema);

class Save {
  static async getSaveByID(id: string) {
    return await SaveModel.findById(id)
      .populate({
        path: 'post',
        populate: [
          {
            path: 'creator',
            select: selectUser
          }
        ]
      })
      .lean();
  }
  static async getSaveByUserID(userID: string, page: string) {
    const limit = 12;
    const skip = parseInt(page) * limit;
    return await SaveModel.find({ user: userID })
      .populate({
        path: 'post',
        populate: [
          {
            path: 'creator',
            select: selectUser
          }
        ]
      })
      .skip(skip)
      .limit(limit)
      .lean();
  }
  static async getSaveByPostIDAndUserID(postID: string, userID: string) {
    return await SaveModel.findOne({ post: postID, user: userID })
      .populate({
        path: 'post',
        populate: [
          {
            path: 'creator',
            select: selectUser
          }
        ]
      })
      .lean();
  }
  static async createSave(values: Record<string, any>) {
    return await SaveModel.create(values);
  }
  static async deleteSave(id: string) {
    return await SaveModel.findByIdAndDelete(id).lean();
  }
  static async deleteMany(values: Record<string, any>) {
    return await SaveModel.deleteMany(values);
  }
  static async updateSave(id: string, values: Record<string, any>) {
    return await SaveModel.findByIdAndUpdate(id, values, { new: true }).lean();
  }
}

export default Save;
