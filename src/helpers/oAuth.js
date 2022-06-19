/* eslint-disable no-return-await */
/* eslint-disable max-classes-per-file */
import axios from 'axios';
import qs from 'qs';
import env from '../setup/config/env.js';
import Logger from '../setup/logger.js';

class Oauth {
  constructor(code) {
    this.code = code;
    this.config = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    };
  }

  getAccessToken() {
    throw new Error('ERR_METHOD_NOT_IMPLEMENTED');
  }

  getUserInfo() {
    throw new Error('ERR_METHOD_NOT_IMPLEMENTED');
  }

  setUserInfo() {
    throw new Error('ERR_METHOD_NOT_IMPLEMENTED');
  }

  async updateAccessToken() {
    const res = await axios.post(
      this.token_url,
      qs.stringify({
        grant_type: 'refresh_token',
        client_id: this.client_id,
        client_secret: this.client_secret,
        refresh_token: this.code,
      }),
      this.config,
    );
    return res.data;
  }

  revokeAccess() {
    throw new Error('ERR_METHOD_NOT_IMPLEMENTED');
  }
}

class Kakao extends Oauth {
  constructor(code) {
    super(code);
    this.token_url = 'https://kauth.kakao.com/oauth/token';
    this.client_id = env.oauth.kakao.clientId;
    this.redirect_uri = `${env.oauth.redirectUri}/kakao`;

    // userInfo
    this.userInfo_url = 'https://kapi.kakao.com/v2/user/me';
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

    // userInfo
    this.userInfo_url = 'https://www.googleapis.com/oauth2/v3/tokeninfo';
  }

  async getAccessToken() {
    const res = await axios.post(
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
    return res.data;
  }

  async getUserInfo(token) {
    try {
      const res = await axios.get(
        `${this.userInfo_url}?id_token=${token.id_token}`,
      );
      return res.data;
    } catch (error) {
      Logger.error(error);
    }
  }

  async setUserInfo(token) {
    const userInfo = await this.getUserInfo(token);
    let result = {};
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
      return '구글 계정과 연결 끊기 완료';
    } catch (error) {
      Logger.error(error);
    }
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

    // userInfo
    this.userInfo_url = 'https://openapi.naver.com/v1/nid/me';
  }
}

export default function makeClass(corp, code) {
  switch (corp) {
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

const config = {
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
  },
};

// 토큰 얻기
const getAccessToken = async (options, grantType) => {
  if (options.scope) {
    // 구글
    const res = await axios.post(
      options.url,
      qs.stringify({
        grant_type: grantType,
        client_id: options.client_id,
        client_secret: options.client_secret,
        redirect_uri: options.redirect_uri,
        code: options.code,
        scope: options.scope,
      }),
      config,
    );
    return res.data;
  }
  if (options.state) {
    const res = await axios.post(
      // 네이버
      options.url,
      qs.stringify({
        grant_type: grantType,
        client_id: options.client_id,
        client_secret: options.client_secret,
        redirect_uri: options.redirect_uri,
        code: options.code,
        state: options.state,
      }),
      config,
    );
    return res.data;
  }
  const res = await axios.post(
    // 카카오
    options.url,
    qs.stringify({
      grant_type: grantType,
      client_id: options.client_id,
      redirect_uri: options.redirect_uri,
      code: options.code,
    }),
    config,
  );
  return res.data;
};

// 유저 정보 얻기
const getUserInfo = async (corp, url, token) => {
  if (corp === 'google') {
    const res = await axios.get(`${url}?id_token=${token.id_token}`);
    return res.data;
  }
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });
  return res.data;
};

const setUserInfo = (corp, userInfo) => {
  let result = {};

  if (corp === 'kakao') {
    result.uuid = userInfo.id;
    result.email = userInfo.kakao_account.email;
    result.name = userInfo.kakao_account.profile.nickname;
  }
  if (corp === 'naver') {
    result.uuid = userInfo.response.id;
    result.email = userInfo.response.email;
    result.name = userInfo.response.name;
  }
  return result;
};

// 연결 끊기
const revokeAccess = async (corp, token) => {
  switch (corp) {
    case 'google':
      return await axios.post(
        `https://oauth2.googleapis.com/revoke?token=${token}`,
      );
    case 'naver':
      return await axios.post(
        `https://nid.naver.com/oauth2.0/token?grant_type=delete&client_id=${process.env.NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRET}&access_token=${token}&service_provider=NAVER`,
      );
    case 'kakao':
      return await axios.get('https://kapi.kakao.com/v1/user/unlink', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    default:
      return null;
  }
};
