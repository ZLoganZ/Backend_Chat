import { Response } from 'express';
import crypto from 'crypto';

import { BadRequest, Unauthorized } from 'cores/error.response';
import User from 'models/users';
import Key from 'models/keys';
import { hash, compare, createTokenPair, getInfoData } from 'utils';
import { sendMailVerifyEmail } from 'configs/email_config';

interface Cache {
  email: string;
  code: string;
  expireAt: number;
  timestamp: number;
  verified?: boolean;
}

const cache: Record<string, Cache> = {};
const getCache = (key: string) => cache[key];
const setCache = (key: string, value: Cache) => (cache[key] = value);
const delCache = (key: string) => delete cache[key];

const generateCode = (email: string) => {
  const code = crypto.randomInt(100000, 999999).toString();
  const timestamp = Date.now();
  const expireAt = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds
  return { email, code, expireAt, timestamp };
};

const storeCache = (email: string) => {
  const setCode = generateCode(email);
  setCache(email, setCode);
  setTimeout(() => delCache(email), 10 * 60 * 1000); // 10 minutes in milliseconds
  return setCode.code;
};

class AuthService {
  static async checkEmail(email: string) {
    // Check if email is exist
    const user = await User.getUserByEmail(email);
    if (user) throw new BadRequest('Email is already exist');

    const cacheEmail = getCache(email);
    if (cacheEmail) delCache(email);

    // Store email in cache
    const code = storeCache(email);

    // Send email
    sendMailVerifyEmail(email, code);

    // Return success message
    return { isRegistered: false };
  }
  static async verifyEmail(email: string, code: string) {
    // Check if email is in cache
    const cacheEmail = getCache(email);
    if (!cacheEmail) throw new BadRequest('Email is not exist');

    // Check if code is correct
    if (cacheEmail.code !== code) throw new BadRequest('Code is not correct');

    // Check if code is expired
    if (cacheEmail.expireAt < Date.now()) throw new BadRequest('Code is expired');

    // Delete email in cache
    delCache(email);

    // Return success message
    return { verified: true };
  }
  static async login(email: string, password: string, res: Response) {
    // Check if email is exist
    const user = await User.getUserByEmail(email);
    if (!user) throw new BadRequest('Email is not exist');

    // Check if password is correct
    const isMatch = await compare(password, user.password);
    if (!isMatch) throw new Unauthorized('Password is not correct');

    // Generate access token
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Generate token pair
    const tokens = createTokenPair({ id: user._id, email: user.email }, publicKey, privateKey);

    // Save token pair
    const key = await Key.createKeyToken(user._id, publicKey, privateKey, tokens.refreshToken);
    if (!key) throw new BadRequest('Something went wrong');

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      path: '/api/auth/refresh-token'
    });

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      path: '/api/auth/refresh-token'
    });

    // Return token pair
    return {
      user: getInfoData({
        fields: ['_id', 'name', 'email'],
        object: user
      }),
      tokens
    };
  }
  static async register(name: string, email: string, password: string) {
    // Check if email is exist
    const user = await User.getUserByEmail(email);
    if (user) throw new BadRequest('Email is already exist');

    const hashPassword = await hash(password);

    // Create user
    const newUser = await User.createUser({ name, email, password: hashPassword });
    if (!newUser) throw new BadRequest('Something went wrong');

    // Generate access token
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Generate token pair
    const tokens = createTokenPair({ id: newUser._id, email: newUser.email }, publicKey, privateKey);

    // Save token pair
    const key = await Key.createKeyToken(newUser._id, publicKey, privateKey, tokens.refreshToken);
    if (!key) throw new BadRequest('Something went wrong');

    // Return token pair
    return {
      user: getInfoData({
        fields: ['_id', 'name', 'email'],
        object: newUser
      }),
      tokens
    };
  }
  static async logout(refreshToken: string) {
    // Check if refresh token is exist
    const key = await Key.findByRefreshToken(refreshToken);
    if (!key) throw new BadRequest('Refresh token is not exist');

    // Delete refresh token
    const deletedKey = await Key.deleteKeyByID(key._id);
    if (!deletedKey) throw new BadRequest('Something went wrong');

    // Return success message
    return { logout: true };
  }
}

export default AuthService;
