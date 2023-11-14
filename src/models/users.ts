import { Schema, model, Types } from 'mongoose';

const DOCUMENT_NAME = 'User';
const COLLECTION_NAME = 'users';

const UserSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, index: true, unique: true },
    password: { type: String, required: true, select: false }
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME
  }
);

const UserModel = model(DOCUMENT_NAME, UserSchema);

class User {
  static async getUsers() {
    return UserModel.find();
  }
  static async getUserByEmail(email: string) {
    return UserModel.findOne({ email }).select('+password');
  }
  static async getUserByID(id: Types.ObjectId) {
    return UserModel.findById(id);
  }
  static async createUser(values: Record<string, any>) {
    return new UserModel(values).save().then((user) => user.toObject());
  }
  static async deleteUser(id: Types.ObjectId) {
    return UserModel.findByIdAndDelete(id);
  }
  static async updateUser(id: Types.ObjectId, values: Record<string, any>) {
    return UserModel.findByIdAndUpdate(id, values, { new: true }).then((user) => user.toObject());
  }
}

export default User;
