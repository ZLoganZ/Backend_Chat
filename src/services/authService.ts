import { Response } from 'express';
import crypto from 'crypto';

import { UserModel } from '../models/users';
import { KeyModel } from '../models/keys';
import { BadRequest, Unauthorized } from '../cores/error.response';
import { hash, compare, createTokenPair, getInfoData } from '../libs/utils';
import { sendMailVerifyEmail } from '../libs/mail_sender';
import { selectUserArr } from '../libs/constants';

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
    const user = await UserModel.getUserByEmail(email);
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
  static async login(payload: { email: string; password: string; res: Response }) {
    const { email, password, res } = payload;

    // Check if email is exist
    const user = await UserModel.getUserByEmail(email);
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
    const tokens = createTokenPair({ _id: user._id, email: user.email }, publicKey, privateKey);

    // Save token pair
    const key = await KeyModel.createKeyToken(
      user._id.toString(),
      publicKey,
      privateKey,
      tokens.refreshToken
    );
    if (!key) throw new BadRequest('Something went wrong');

    // Return token pair
    return {
      user: getInfoData({
        fields: ['_id', 'name', 'email', 'image', 'bio'],
        object: user
      }),
      tokens
    };
  }
  static async register(payload: {
    name: string;
    email: string;
    password: string;
    alias: string;
    res: Response;
  }) {
    const { name, email, password, alias, res } = payload;

    // Check if alias is exist
    const userAlias = await UserModel.getUserByAlias(alias);
    if (userAlias) throw new BadRequest('Alias is already used');
    // Check if email is exist
    const user = await UserModel.getUserByEmail(email);
    if (user) throw new BadRequest('Email is already exist');

    const hashPassword = await hash(password);

    // Create user
    const newUser = await UserModel.createUser({ name, email, password: hashPassword, alias });
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
    const tokens = createTokenPair({ _id: newUser._id, email: newUser.email }, publicKey, privateKey);

    // Save token pair
    const key = await KeyModel.createKeyToken(
      newUser._id.toString(),
      publicKey,
      privateKey,
      tokens.refreshToken
    );
    if (!key) throw new BadRequest('Something went wrong');

    // Return token pair
    return {
      user: getInfoData({
        fields: ['_id', 'name', 'email', 'image', 'bio'],
        object: newUser
      }),
      tokens
    };
  }
  static async logout(payload: { refreshToken: string; res: Response }) {
    const { refreshToken, res } = payload;

    // Check if refresh token is exist
    const key = await KeyModel.findByRefreshToken(refreshToken);
    if (!key) throw new BadRequest('Refresh token is not exist');

    // Delete refresh token
    const deletedKey = await KeyModel.deleteKeyByID(key._id.toString());
    if (!deletedKey) throw new BadRequest('Something went wrong');

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    // Return success message
    return { logout: true };
  }
  static async me(id: string) {
    // Check if user is exist
    const user = await UserModel.getUserByID(id);
    if (!user) throw new BadRequest('UserModel is not exist');

    // Return user
    return getInfoData({
      fields: selectUserArr,
      object: user
    });
  }
}

export default AuthService;
