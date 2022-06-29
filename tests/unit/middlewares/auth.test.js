import httpMocks from 'node-mocks-http';
import { faker } from '@faker-js/faker';
import {
  admin,
  protect,
} from '../../../src/infrastructure/setup/middlewares/auth';
import jwtManager from '../../../src/infrastructure/setup/security/jwtTokenManager';

describe('🎯 Auth Middleware', () => {
  describe('⛳️ protect', () => {
    it('protect, header 중에 Authorization이 없으면 401 코드를 반환한다', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        url: 'api/users/logout',
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      protect(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().message).toBe('Not authorized, no token');
      expect(next).not.toBeCalled();
    });

    it('protect, Authorization header가 Bearer type이 아니면 401 코드를 반환한다', async () => {
      const req = httpMocks.createRequest({
        method: 'GET',
        url: 'api/users/logout',
        headers: { authorization: 'Bear' },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      protect(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().message).toBe('Not authorized, no token');
      expect(next).not.toBeCalled();
    });

    it('protect, JWT 토큰 서명이 유효하지 않으면 401 코드를 반환한다', async () => {
      const token = faker.random.alphaNumeric(128);
      const req = httpMocks.createRequest({
        method: 'GET',
        url: 'api/users/logout',
        headers: { authorization: `Bearer ${token}` },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      jwtManager.verify = jest.fn((token) => {
        throw Error;
      });
      protect(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res._getJSONData().message).toBe('Not authorized, token failed');
      expect(next).not.toBeCalled();
    });

    it('protect, JWT 토큰 서명이 유효하다면 req.user에 payload를 담고 next로 넘긴다', async () => {
      const token = faker.random.alphaNumeric(128);
      const userId = faker.random.alphaNumeric(32);
      const req = httpMocks.createRequest({
        method: 'GET',
        url: 'api/users/logout',
        headers: { authorization: `Bearer ${token}` },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      jwtManager.verify = jest.fn((token) => {
        return { id: userId };
      });
      protect(req, res, next);

      expect(req.user).toMatchObject({ id: userId });
      expect(next).toBeCalledTimes(1);
    });
  });

  describe('⛳️ admin', () => {
    it('admin, req.user.isAdmin이 false라면 403 코드를 반환한다', async () => {
      const token = faker.random.alphaNumeric(128);
      const userId = faker.random.alphaNumeric(32);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: 'api/users/logout',
        headers: { authorization: `Bearer ${token}` },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      jwtManager.verify = jest.fn((token) => {
        return { id: userId, isAdmin: false };
      });

      protect(req, res, next);
      admin(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res._getJSONData().message).toBe('Not authorized, as an admin');
      expect(next).toBeCalledTimes(1);
    });

    it('admin, req.user.isAdmin이 true라면 next로 넘긴다', async () => {
      const token = faker.random.alphaNumeric(128);
      const userId = faker.random.alphaNumeric(32);

      const req = httpMocks.createRequest({
        method: 'GET',
        url: 'api/users/logout',
        headers: { authorization: `Bearer ${token}` },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      jwtManager.verify = jest.fn((token) => {
        return { id: userId, isAdmin: true };
      });

      protect(req, res, next);
      admin(req, res, next);

      expect(next).toBeCalledTimes(2);
    });
  });
});
