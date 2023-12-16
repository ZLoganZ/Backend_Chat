import mongoose from 'mongoose';

const dbURL = process.env.NODE_ENV === 'production' ? process.env.DB_URL : process.env.DB_URL;

const connectDB = () => {
  mongoose.set('debug', true);
  mongoose.set('debug', { color: true });
  mongoose.Promise = global.Promise;
  mongoose.connect(dbURL + 'InstaFram');
  mongoose.connection.on('connected', () => {
    console.log('Connected to database');
  });
  mongoose.connection.on('error', (error) => {
    console.error('Error connecting to database: ', error);
  });
};

export default connectDB;
