import { Router } from 'express';

import AuthController from 'controllers/authController';
import { asyncHandler } from 'utils';
import { Authentication } from 'middlewares';

const router = Router();

router.post('/checkEmail', asyncHandler(AuthController.checkEmail));
router.post('/verifyEmail', asyncHandler(AuthController.verifyEmail));
router.post('/login', asyncHandler(AuthController.login));
router.post('/register', asyncHandler(AuthController.register));
router.use(Authentication);
router.post('/logout', asyncHandler(AuthController.logout));
router.get('/me', asyncHandler(AuthController.me));

export default router;
