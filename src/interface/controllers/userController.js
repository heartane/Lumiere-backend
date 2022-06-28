/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
import asyncHandler from 'express-async-handler';
import userService from '../../application/userService.js';

// @desc   Check a email address
// @route  POST /api/users/email
// @access Public
export const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const { status, message, data } = await userService.checkEmail(email);
  res.status(status).json({ message, data });
});

// @desc   Register a new general user
// @route  POST /api/users
// @access Public
export const register = asyncHandler(async (req, res) => {
  const userInfo = req.body;

  const { status, message, data } = await userService.register(userInfo);
  res.status(status).json({ message, data });
});

// @desc   Auth & get token for general user
// @route  POST /api/users/login
// @access Public
export const generalLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { status, message, data } = await userService.generalLogin(
    email,
    password,
  );

  if (message) {
    return res.status(status).json({ message, data });
  }
  res.status(status).json(data);
});

// @desc   Log user logout time
// @route  GET /api/users/logout
// @access Private
export const logout = asyncHandler(async (req, res) => {
  const { status, message } = await userService.logout(req.user.id);

  res.status(status).json({ message });
});

// @desc   Fetch token & userInfo from corporations
// @route  GET /api/users/:corp
// @access Public
export const oAuthLogin = asyncHandler(async (req, res) => {
  const { corp } = req.params;
  const { code } = req.query;

  const { status, data } = await userService.socialLogin(corp, code);

  res.status(status).json(data);
});

// @desc   Check user password
// @route  POST /api/users/profile
// @access Private
export const checkPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const { status, message } = await userService.checkPassword(
    req.user.id,
    password,
  );
  res.status(status).json({ message });
});

// @desc   Update user password
// @route  PATCH /api/users/profile
// @access Private
export const updatePassword = asyncHandler(async (req, res) => {
  let { password } = req.body;

  const { status, message, data } = await userService.updatePassword(
    req.user.id,
    password,
  );

  res.status(status).json({
    message,
    token: data,
  });
});

// @desc   Delete user profile
// @route  DELETE /api/users/profile
// @access Private & Private/Admin
export const withdraw = asyncHandler(async (req, res) => {
  // 유저 본인이 탈퇴 요청 / 관리자가 탈퇴 요청

  const { status, message } = await userService.withdraw(
    req.user,
    req.query.userId,
  );

  res.status(status).json({ message });
});

// @desc   Get all users except admin
// @route  GET /api/users
// @access Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.pageNumber) || 1;

  const { status, data } = await userService.getUsers(page);

  res.status(status).json(data);
});
