/* eslint-disable camelcase */
import axios from 'axios';
import qs from 'qs';

// 상위 클래스
export class Oauth {
  constructor(code, logger) {
    this.code = code;
    this.logger = logger;
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
      this.logger.error(e.stack);
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
      this.logger.error(e.stack);
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
      this.logger.error(e.stack);
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
