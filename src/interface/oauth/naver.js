/* eslint-disable camelcase */
import axios from 'axios';
import env from '../../infrastructure/config/env.js';
import { Oauth } from './oauth.js';

export default class Naver extends Oauth {
  constructor(code, logger) {
    super(code, logger);
    this.token_url = 'https://nid.naver.com/oauth2.0/token';
    this.client_id = env.oauth.naver.clientId;
    this.client_secret = env.oauth.naver.clientSecret;
    this.redirect_uri = `${env.oauth.redirectUri}/naver`;
    this.state = env.oauth.naver.state;

    this.userInfo_url = 'https://openapi.naver.com/v1/nid/me';
  }

  async setUserInfo(token) {
    const userInfo = await this.getUserInfo(token);
    const result = {};
    result.uuid = userInfo.response.id;
    result.email = userInfo.response.email;
    result.name = userInfo.response.name;
    return result;
  }

  async revokeAccess() {
    let res;
    const { access_token } = await this.updateAccessToken();
    try {
      res = await axios.post(
        `https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${this.client_id}&client_secret=${this.client_secret}&access_token=${access_token}&service_provider=NAVER`,
      );
    } catch (e) {
      this.logger.error(e.stack);
    }
    return res.data.result === 'success'
      ? '네비버 계정과 연결 끊기 완료'
      : null;
  }
}
