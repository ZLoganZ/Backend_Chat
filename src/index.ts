require('dotenv').config();
import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';

import routers from './routers';
import connectDB from './configs/initDB';

const app = express();

app.use(cors({ credentials: true }));
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

const server = http.createServer(app);

server.listen(8080, () => {
  console.log('Server is running on port 8080');
});

app.use('/api/v1', routers());

// handling error
app.use((_, __, next) => {
  const error = new Error('Not found');
  next(error);
});

app.use((error: any, _: any, res: any, __: any) => {
  res.status(error.status || 500);
  res.json({
    status: error.status,
    message: error.message || 'Internal server error'
  });
});
