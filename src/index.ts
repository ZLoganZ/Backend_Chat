require('dotenv').config();
import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';

import routers from 'routers';
import { CustomError } from 'types';
import connectDB from 'configs/initDB';
import { SenderMailServer } from 'configs/email_config';

const app = express();

app.use(
  cors({
    origin: 'http://localhost:4000',
    credentials: true
  })
);
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', routers);

// handling error
app.use((_, __, next) => {
  const error = new CustomError('Not found route', 404);
  next(error);
});

app.use((error: CustomError, _: express.Request, res: express.Response, __: express.NextFunction) => {
  res.status(error.code || 500).json({
    status: error.code || 500,
    message: error.message || 'Internal server error'
  });
});

connectDB();
SenderMailServer();

const server = http.createServer(app);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
