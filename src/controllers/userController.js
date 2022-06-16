/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcrypt';
import * as UserRepository from '../repositories/UserRepository.js';
import serializeSingleUserInfo from '../serializers/UserSerializer.js';
import {
  getAccessToken,
  getOption,
  getUserInfo,
  revokeAccess,
  updateAccessToken,
} from '../utils/oAuth.js';

// @desc   Check a email address
// @route  POST /api/users/email
// @access Public
const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (await UserRepository.findByEmail(email)) {
    res.status(401).json({ message: '이미 해당 이메일이 존재합니다' });
  } else {
    res.status(200).send({ message: '사용 가능한 이메일입니다' });
  }
});

// @desc   Register a new general user
// @route  POST /api/users
// @access Public
const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (email && password && name) {
    const user = await UserRepository.createUser(
      {
        general: { email, password },
        name,
      },
      'general',
    );

    res.status(201).json({ message: `회원가입 완료, ${user._id}` });
  } else {
    res.status(400).json({ message: '모든 항목은 필수입니다' });
  }
});

// @desc   Auth & get token for general user
// @route  POST /api/users/login
// @access Public
const generalLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await UserRepository.findByEmail(email);

  if (!user) {
    res.status(401).json({ message: '이메일을 다시 확인해주세요' });
    return;
  }

  if (user.active.isClosed === true && !user.general.password) {
    res.status(401).json({ message: '이미 탈퇴한 회원입니다' });
    return;
  }

  if (await user.matchPassword(password)) {
    res.json(serializeSingleUserInfo(user));
  } else {
    res.status(401).json({ message: '비밀번호를 다시 확인해주세요' });
  }
});

// @desc   Log user logout time
// @route  GET /api/users/logout
// @access Private
const logout = asyncHandler(async (req, res) => {
  const time = await UserRepository.logLastAccessTime(req.user.id);

  res.status(200).json({ message: `로그아웃 시간, ${time}` });
});

// @desc   Fetch token & userInfo from corporations
// @route  GET /api/users/:corp
// @access Public
const oAuthLogin = asyncHandler(async (req, res) => {
  const { corp } = req.params;
  const { code } = req.query;

  const options = getOption(corp, code);
  const token = await getAccessToken(options, 'authorization_code');
  const userInfo = await getUserInfo(corp, options.userInfo_url, token);

  let uuid;
  let email;
  let name;

  if (corp === 'google') {
    uuid = userInfo.sub;
    email = userInfo.email;
    name = userInfo.name;
  }
  if (corp === 'kakao') {
    uuid = userInfo.id;
    email = userInfo.kakao_account.email;
    name = userInfo.kakao_account.profile.nickname;
  }
  if (corp === 'naver') {
    uuid = userInfo.response.id;
    email = userInfo.response.email;
    name = userInfo.response.name;
  }
  // DB와 연락하기
  const { access_token, refresh_token } = token;
  const user = await UserRepository.findSocialUser({
    uuid,
    email,
    access_token,
    refresh_token,
  });

  if (user) {
    res.json(serializeSingleUserInfo(user));
  } else {
    const newUser = await UserRepository.createUser(
      {
        [`${corp}.uuid`]: uuid,
        [`${corp}.email`]: email,
        [`${corp}.accessToken`]: access_token,
        [`${corp}.refreshToken`]: refresh_token,
        name,
      },
      'social',
    );
    res.json(serializeSingleUserInfo(newUser));
  }
});

// @desc   Check user password
// @route  POST /api/users/profile
// @access Private
const checkPwd = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await UserRepository.findById(req.user.id);

  if (!user.general) {
    res.status(401).json({ message: '소셜 유저는 변경이 불가합니다' });
  } else if (await user.matchPassword(password)) {
    res.json({ message: '비밀번호 일치' });
  } else {
    res.status(401).json({ message: '비밀번호 불일치' });
  }
});

// @desc   Update user password
// @route  PATCH /api/users/profile
// @access Private
const updatePwd = asyncHandler(async (req, res) => {
  // checkUserPwd을 통해 일반 유저인지 확인했음
  let { password } = req.body;

  if (password) {
    password = await bcrypt.hash(password, 10);

    const updatedUser = await UserRepository.updatePassword(
      req.user.id,
      password,
    );
    res.status(200).json({
      message: '비밀번호가 성공적으로 변경되었습니다',
      token: serializeSingleUserInfo(updatedUser).token,
    });
  } else {
    res.status(400).json({
      message: '새 비밀번호를 입력해주세요',
    });
  }
});

// @desc   Delete user profile
// @route  DELETE /api/users/profile
// @access Private & Private/Admin
const dropout = asyncHandler(async (req, res) => {
  // 유저 본인이 탈퇴 요청 / 관리자가 탈퇴 요청

  if (req.user.isAdmin === true) {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({
        message: '탈퇴시킬 회원을 기입해주세요',
      });
    }
    const user = await UserRepository.findById(userId);
    if (user.general) {
      await UserRepository.blockOff(user._id, 'general');
      return res.status(200).json({
        message: `해당 유저를 정상적으로 탈퇴시켰습니다`,
      });
    }
    return res.status(400).json({
      message: `소셜 로그인 유저입니다`,
    });
  }

  if (req.user.isAdmin === false) {
    const user = await UserRepository.findById(req.user.id);
    if (user.general) {
      await UserRepository.blockOff(user._id, 'general');
      return res.status(200).json({ message: '루미에르를 탈퇴하셨습니다' });
    }

    const { google, naver, kakao } = user;
    const corp = google.uuid
      ? 'google'
      : naver.uuid
      ? 'naver'
      : kakao.uuid
      ? 'kakao'
      : null;

    const options = getOption(corp, `${user[corp].refreshToken}`);
    const token = await updateAccessToken(options, 'refresh_token');
    const { access_token } = token;

    // 엑세스 끊기
    const revokeRes = await revokeAccess(corp, access_token);
    let message;

    if (revokeRes.data.id && corp === 'kakao') {
      message = '카카오 계정과 연결 끊기 완료';
    }
    if (revokeRes.data.result === 'success' && corp === 'naver') {
      message = '네이버 계정과 연결 끊기 완료';
    }
    if (revokeRes.status === 200 && corp === 'google') {
      message = '구글 계정과 연결 끊기 완료';
    }
    await UserRepository.blockOff(req.user.id, 'social');
    res.status(200).json(message);
  }
});

// @desc   Get all users except admin
// @route  GET /api/users
// @access Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  const count = await UserRepository.countDocs({ isAdmin: false });
  const users = await UserRepository.findUsers(pageSize, page, {
    isAdmin: false,
  });
  res.json({ users, page, pages: Math.ceil(count / pageSize) });
});

export {
  checkEmail,
  register,
  generalLogin,
  oAuthLogin,
  checkPwd,
  updatePwd,
  logout,
  dropout,
  getUsers,
};
