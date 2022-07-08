import asyncHandler from 'express-async-handler';
import { HTTP_STATUS } from '../../infrastructure/config/constants.js';
import config from '../../infrastructure/config/env.js';
import {
  serializePagination,
  serializeSingleUserInfo,
} from '../helper/serializer.js';
import factoryForOauth from '../oauth/index.js';

export default class UserController {
  #userService;

  constructor(userService) {
    this.#userService = userService;
  }

  // @desc   Check a email address
  // @route  POST /api/users/email
  // @access Public
  checkEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const data = await this.#userService.checkEmail(email);

    if (data) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json('사용 불가');
    } else {
      res.status(HTTP_STATUS.OK).json('사용 가능');
    }
  });

  // @desc   Register a new general user
  // @route  POST /api/users
  // @access Public
  register = asyncHandler(async (req, res) => {
    const userInfo = req.body;

    const data = await this.#userService.register(userInfo);

    if (!data) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json('유저 생성 오류');
    } else {
      res.status(HTTP_STATUS.CREATE).json(`회원가입 완료, ${data}`);
    }
  });

  // @desc   Auth & get token for general user
  // @route  POST /api/users/login
  // @access Public
  generalLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const data = await this.#userService.generalLogin(email, password);

    if (!data) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json('Invalid Input');
    } else {
      res.status(HTTP_STATUS.OK).json(serializeSingleUserInfo(data));
    }
  });

  // @desc   Log user logout time
  // @route  GET /api/users/logout
  // @access Private
  logout = asyncHandler(async (req, res) => {
    const data = await this.#userService.logout(req.user.id);

    res.status(HTTP_STATUS.OK).json(`로그아웃 시간, ${data}`);
  });

  // @desc   Fetch token & userInfo from corporations
  // @route  GET /api/users/:corp
  // @access Public
  oAuthLogin = asyncHandler(async (req, res) => {
    const { corp } = req.params;
    const { code } = req.query;

    const data = await this.#userService.socialLogin(
      corp,
      code,
      factoryForOauth,
    );

    if (!data) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json('소셜 로그인 오류');
    } else {
      res.status(HTTP_STATUS.OK).json(serializeSingleUserInfo(data));
    }
  });

  // @desc   Check user password
  // @route  POST /api/users/profile
  // @access Private
  checkPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;

    const data = await this.#userService.checkPassword(req.user.id, password);

    if (!data) res.status(HTTP_STATUS.UNAUTHORIZED).json('불일치');
    return res.status(HTTP_STATUS.OK).json('일치');
  });

  // @desc   Update user password
  // @route  PATCH /api/users/profile
  // @access Private
  updatePassword = asyncHandler(async (req, res) => {
    const { password } = req.body;

    const data = await this.#userService.updatePassword(req.user.id, password);

    res
      .status(HTTP_STATUS.OK)
      .json({ token: serializeSingleUserInfo(data).token });
  });

  // @desc   Delete user profile
  // @route  DELETE /api/users/profile
  // @access Private & Private/Admin
  withdraw = asyncHandler(async (req, res) => {
    const data = await this.#userService.withdraw(
      req.user,
      factoryForOauth,
      req.query.userId,
    );

    if (!data) res.status(HTTP_STATUS.INTERNAL_ERROR).json('탈퇴 오류');
    return res.status(HTTP_STATUS.OK).json('탈퇴 완료');
  });

  // @desc   Get all users except admin
  // @route  GET /api/users
  // @access Private/Admin
  getUsers = asyncHandler(async (req, res) => {
    const page = Number(req.query.pageNumber) || 1;
    const { pageSize } = config.pagination;

    const { users, count } = await this.#userService.getUsers(page, pageSize);

    res
      .status(HTTP_STATUS.OK)
      .json(serializePagination({ users }, page, count, pageSize));
  });
}
