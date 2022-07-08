/* eslint-disable camelcase */
import axios from 'axios';
import env from '../../infrastructure/config/env.js';
import { Oauth } from './oauth.js';

export default class Google extends Oauth {
  constructor(code, logger) {
    super(code, logger);
    this.token_url = 'https://oauth2.googleapis.com/token';
    this.client_id = env.oauth.google.clientId;
    this.client_secret = env.oauth.google.clientSecret;
    this.redirect_uri = `${env.oauth.redirectUri}/google`;
    this.scope =
      'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid';

    this.userInfo_url = 'https://www.googleapis.com/oauth2/v3/tokeninfo';
  }

  async getUserInfo(token) {
    let res;
    try {
      res = await axios.get(`${this.userInfo_url}?id_token=${token.id_token}`);
    } catch (e) {
      this.logger.error(e.stack);
    }
    return res.data;
  }

  async setUserInfo(token) {
    const userInfo = await this.getUserInfo(token);
    const result = {};
    result.uuid = userInfo.sub;
    result.email = userInfo.email;
    result.name = userInfo.name;
    return result;
  }

  async revokeAccess() {
    const { access_token } = await this.updateAccessToken();
    try {
      await axios.post(
        `https://oauth2.googleapis.com/revoke?token=${access_token}`,
      );
    } catch (e) {
      this.logger.error(e.stack);
    }
    return '구글 계정과 연결 끊기 완료';
  }
}
