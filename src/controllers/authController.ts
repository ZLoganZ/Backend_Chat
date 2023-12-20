import { Response, NextFunction } from 'express';

import { Ok, Created, Accepted } from '../cores/success.response';
import AuthService from '../services/authService';
import { RequestWithUser } from '../types';

class AuthController {
  static async checkEmailSignup(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Check email successfully', await AuthService.checkEmailSignup(req.body.email)).send(res);
  }
  static async checkEmailForgotPassword(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Check email successfully', await AuthService.checkEmailForgotPassword(req.body.email)).send(res);
  }
  static async verifyCode(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Verify email successfully', await AuthService.verifyCode(req.body.email, req.body.code)).send(
      res
    );
  }
  static async resetPassword(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Reset password successfully', await AuthService.resetPassword(req.body)).send(res);
  }
  static async login(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Login successfully', await AuthService.login({ ...req.body })).send(res);
  }
  static async register(req: RequestWithUser, res: Response, _: NextFunction) {
    new Created('Register successfully', await AuthService.register({ ...req.body })).send(res);
  }
  static async logout(req: RequestWithUser, res: Response, _: NextFunction) {
    new Accepted(
      'Logout successfully',
      await AuthService.logout({ refreshToken: req.user.refreshToken })
    ).send(res);
  }
  static async me(req: RequestWithUser, res: Response, _: NextFunction) {
    new Ok('Get user successfully', await AuthService.me(req.user._id)).send(res);
  }
}

export default AuthController;
