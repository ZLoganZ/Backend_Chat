import { Router } from 'express';

import authRouter from './authRouter';
import postRouter from './postRouter';
import userRouter from './userRouter';
import { Authentication } from 'middlewares';

const router = Router();

router.use('/auth', authRouter);
router.use(Authentication);
router.use('/posts', postRouter);
router.use('/users', userRouter);


export default router;
