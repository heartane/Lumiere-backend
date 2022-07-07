/* eslint-disable camelcase */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import axios from 'axios';
import qs from 'qs';
import env from '../../infrastructure/config/env.js';
import Logger from '../../infrastructure/express-server/logger.js';

// 상위 클래스
class Oauth {
  constructor(code) {
    this.code = code;
    this.config = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    };
  }

  async getAccessToken() {
    let res;
    try {
      res = await axios.post(
        this.token_url,
        qs.stringify({
          grant_type: 'authorization_code',
          client_id: this.client_id,
          client_secret: this.client_secret,
          redirect_uri: this.redirect_uri,
          code: this.code,
          scope: this.scope,
          state: this.state,
        }),
        this.config,
      );
    } catch (e) {
      Logger.error(e.stack);
    }
    return res.data;
  }

  async updateAccessToken() {
    let res;
    try {
      res = await axios.post(
        this.token_url,
        qs.stringify({
          grant_type: 'refresh_token',
          client_id: this.client_id,
          client_secret: this.client_secret,
          refresh_token: this.code,
        }),
        this.config,
      );
    } catch (e) {
      Logger.error(e.stack);
    }
    return res.data;
  }

  async getUserInfo(token) {
    let res;
    try {
      res = await axios.get(this.userInfo_url, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });
    } catch (e) {
      Logger.error(e.stack);
    }
    return res.data;
  }

  setUserInfo() {
    throw new Error('ERR_METHOD_SHOULD_OVERRIDE');
  }

  revokeAccess() {
    throw new Error('ERR_METHOD_SHOULD_OVERRIDE');
  }
}

class Kakao extends Oauth {
  constructor(code) {
    super(code);
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
      Logger.error(e.stack);
    }
    return res.data.id ? '카카오 계정과 연결 끊기 완료' : null;
  }
}

class Google extends Oauth {
  constructor(code) {
    super(code);
    this.token_url = 'https://oauth2.googleapis.com/token';
    this.client_id = env.oauth.google.clientId;
    this.client_secret = env.oauth.google.clientSecret;
    this.redirect_uri = `${env.oauth.redirectUri}/google`;
    this.scope =
      'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid';

    this.userInfo_url = 'https://www.googleapis.com/oauth2/v3/tokeninfo';
  }

  async getAccessToken() {
    let res;
    try {
      res = await axios.post(
        this.token_url,
        qs.stringify({
          grantType: 'authorization_code',
          client_id: this.client_id,
          client_secret: this.client_secret,
          redirect_uri: this.redirect_uri,
          code: this.code,
          scope: this.scope,
        }),
        this.config,
      );
    } catch (e) {
      Logger.error(e.stack);
    }
    return res.data;
  }

  async getUserInfo(token) {
    let res;
    try {
      res = await axios.get(`${this.userInfo_url}?id_token=${token.id_token}`);
    } catch (e) {
      Logger.error(e.stack);
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
      Logger.error(e.stack);
    }
    return '구글 계정과 연결 끊기 완료';
  }
}

class Naver extends Oauth {
  constructor(code) {
    super(code);
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
      Logger.error(e.stack);
    }
    return res.data.result === 'success'
      ? '네비버 계정과 연결 끊기 완료'
      : null;
  }
}

export default function makeClassForTokenRequest(corporation, code) {
  switch (corporation) {
    case 'google':
      return new Google(code);
    case 'kakao':
      return new Kakao(code);
    case 'naver':
      return new Naver(code);
    default:
      return null;
  }
}
