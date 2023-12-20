require('dotenv').config();
import http from 'http';
import app from './app';
import connectDB from './configs/initDB';
import { MailSenderServer } from './libs/mail_sender';

connectDB();

MailSenderServer();

const server = http.createServer(app);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
