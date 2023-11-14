import { Response, NextFunction } from 'express';

import { Ok, Created, Accepted } from '../cores/success.response';
import AuthService from '../services/authService';
import { RequestWithUser } from '../types';

class AuthController {
  static async login(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Login successfully', await AuthService.login(req.body.email, req.body.password, res)).send(res);
  }
  static async register(req: RequestWithUser, res: Response, _: NextFunction) {
    new Created(
      'Register successfully',
      await AuthService.register(req.body.username, req.body.email, req.body.password)
    ).send(res);
  }
  static async logout(req: RequestWithUser, res: Response, _: NextFunction) {
    new Accepted('Logout successfully', await AuthService.logout(req.user.refreshToken)).send(res);
  }
}

export default AuthController;
