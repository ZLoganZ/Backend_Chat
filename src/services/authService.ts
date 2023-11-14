import { Response } from 'express';
import crypto from 'crypto';

import { BadRequest, Unauthorized } from '../cores/error.response';
import User from '../models/users';
import Key from '../models/keys';
import { hash, compare, createTokenPair, getInfoData } from '../utils';

class AuthService {
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
        fields: ['_id', 'username', 'email'],
        object: user
      }),
      tokens
    };
  }
  static async register(username: string, email: string, password: string) {
    // Check if email is exist
    const user = await User.getUserByEmail(email);
    if (user) throw new BadRequest('Email is already exist');

    const hashPassword = await hash(password);

    // Create user
    const newUser = await User.createUser({ username, email, password: hashPassword });
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
        fields: ['_id', 'username', 'email'],
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
