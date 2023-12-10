import { Response, NextFunction } from 'express';

import { Ok, Created, Accepted } from '../cores/success.response';
import UserService from '../services/userService';
import { RequestWithUser } from '../types';

class UserController {
  static async getUser(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Get user successfully', await UserService.getUser(req.params.userIDorAlias)).send(res);
  }
  static async getTopCreators(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Get popular users successfully',
      await UserService.getTopCreators(req.query.page.toString())
    ).send(res);
  }
  static async updateUser(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Update user successfully',
      await UserService.updateUser({ userID: req.user._id, updateUser: { ...req.body, image: req.file } })
    ).send(res);
  }
  static async followUser(req: RequestWithUser, res: Response, _: NextFunction) {
    new Accepted(
      'Follow user successfully',
      await UserService.followUser({ userID: req.user._id, followID: req.params.userID })
    ).send(res);
  }
}

export default UserController;
