import httpMocks from 'node-mocks-http';
import { faker } from '@faker-js/faker';
import * as validator from 'express-validator';
import validate from '../../../src/infrastructure/setup/middlewares/validator';

jest.mock('express-validator');

function readOnly(obj) {
  return obj;
}

describe('🎯 Validator Middleware', () => {
  it('유효하지 않은 데이터라면 400 코드와 함께 에러메세지를 반환합니다', () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();
    const errMsg = faker.random.words(5);

    readOnly(validator).validationResult = jest.fn(() => ({
      isEmpty: () => false,
      array: () => [{ msg: errMsg }],
    }));
    validate(req, res, next);

    expect(res._getJSONData().message).toMatch(errMsg);
    expect(res.statusCode).toBe(400);
    expect(next).not.toBeCalled();
  });

  it('유효한 데이터라면 next를 호출합니다', () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();

    readOnly(validator).validationResult = jest.fn(() => ({
      isEmpty: () => true,
    }));
    validate(req, res, next);

    expect(next).toBeCalledTimes(1);
  });
});
