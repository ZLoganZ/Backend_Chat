import mongoose from 'mongoose';

const dbURL = process.env.DB_URL;

const connectDB = () => {
  mongoose.set('debug', true);
  mongoose.set('debug', { color: true });
  mongoose.Promise = global.Promise;
  mongoose.connect(dbURL + 'chatApp');
  mongoose.connection.on('connected', () => {
    console.log('Connected to database');
  });
  mongoose.connection.on('error', (error) => {
    console.error('Error connecting to database: ', error);
  });
};

export default connectDB;
