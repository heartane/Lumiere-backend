/* eslint-disable class-methods-use-this */
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';

export default class JwtManager {
  encode(payload) {
    return jwt.sign(payload, env.jwt.secretKey, {
      expiresIn: env.jwt.expireTime,
    });
  }

  verify(token) {
    return jwt.verify(token, env.jwt.secretKey);
  }
}
