/* eslint-disable camelcase */
import axios from 'axios';
import env from '../../infrastructure/config/env.js';
import { Oauth } from './oauth.js';

export default class Kakao extends Oauth {
  constructor(code, logger) {
    super(code, logger);
    this.token_url = 'https://kauth.kakao.com/oauth/token';
    this.client_id = env.oauth.kakao.clientId;
    this.client_secret = env.oauth.kakao.clientSecret;
    this.redirect_uri = `${env.oauth.redirectUri}/kakao`;

    this.userInfo_url = 'https://kapi.kakao.com/v2/user/me';
  }

  async setUserInfo(token) {
    const userInfo = await this.getUserInfo(token);
    const result = {};
    result.uuid = userInfo.id;
    result.email = userInfo.kakao_account.email;
    result.name = userInfo.kakao_account.profile.nickname;
    return result;
  }

  async revokeAccess() {
    let res;
    const { access_token } = await this.updateAccessToken();
    try {
      res = await axios.get('https://kapi.kakao.com/v1/user/unlink', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
    } catch (e) {
      this.logger.error(e.stack);
    }
    return res.data.id ? '카카오 계정과 연결 끊기 완료' : null;
  }
}
