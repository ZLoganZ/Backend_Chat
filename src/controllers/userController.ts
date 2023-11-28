import { Response, NextFunction } from 'express';

import { Ok, Created, Accepted } from 'cores/success.response';
import UserService from 'services/userService';
import { RequestWithUser } from 'types';

class UserController {
  static async getUserByID(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Get user by id successfully', await UserService.getUserByID(req.params.userID)).send(res);
  }
  static async getTopCreators(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Get popular users successfully', await UserService.getTopCreators()).send(res);
  }
  static async updateUser(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok(
      'Update user successfully',
      await UserService.updateUser(req.user._id, { ...req.body, image: req.file })
    ).send(res);
  }
}

export default UserController;
