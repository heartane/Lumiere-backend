import httpMocks from 'node-mocks-http';
import { faker } from '@faker-js/faker';
import * as validator from 'express-validator';
import validate from '../validator';

jest.mock('express-validator');

describe('๐ฏ Validator Middleware', () => {
  it('์ ํจํ์ง ์์ ๋ฐ์ดํฐ๋ผ๋ฉด 400 ์ฝ๋์ ํจ๊ป ์๋ฌ๋ฉ์ธ์ง๋ฅผ ๋ฐํํฉ๋๋ค', () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();
    const errMsg = faker.random.words(5);

    validator.validationResult = jest.fn(() => ({
      isEmpty: () => false,
      array: () => [{ msg: errMsg }],
    }));
    validate(req, res, next);

    expect(res._getJSONData().message).toMatch(errMsg);
    expect(res.statusCode).toBe(400);
    expect(next).not.toBeCalled();
  });

  it('์ ํจํ ๋ฐ์ดํฐ๋ผ๋ฉด next๋ฅผ ํธ์ถํฉ๋๋ค', () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();

    validator.validationResult = jest.fn(() => ({
      isEmpty: () => true,
    }));
    validate(req, res, next);

    expect(next).toBeCalledTimes(1);
  });
});
