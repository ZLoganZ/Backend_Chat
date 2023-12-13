import { Router } from 'express';

import AuthController from '../controllers/authController';
import { asyncHandler } from '../libs/utils';
import { Authentication } from '../middlewares';

const router = Router();

router.post('/checkEmail', asyncHandler(AuthController.checkEmailSignup));
router.post('/checkEmailForgotPassword', asyncHandler(AuthController.checkEmailForgotPassword));
router.post('/verifyCode', asyncHandler(AuthController.verifyCode));
router.post('/resetPassword', asyncHandler(AuthController.resetPassword));
router.post('/login', asyncHandler(AuthController.login));
router.post('/register', asyncHandler(AuthController.register));
router.use(Authentication);
router.post('/logout', asyncHandler(AuthController.logout));
router.get('/me', asyncHandler(AuthController.me));

export default router;
