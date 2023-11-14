import { Router } from 'express';

import AuthController from '../controllers/authentication';
import { asyncHandler } from '../utils';

export default (router: Router) => {
  router.post('/auth/login', asyncHandler(AuthController.login));
  router.post('/auth/register', asyncHandler(AuthController.register));
  router.post('/auth/logout', asyncHandler(AuthController.logout));
};
