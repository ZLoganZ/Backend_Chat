import { Router } from 'express';

import authRouter from './authRouter';
import { Authentication } from 'middlewares';

const router = Router();

export default () => {
  authRouter(router);

  return router;
};
