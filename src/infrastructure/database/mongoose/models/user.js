/* eslint-disable func-names */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import env from '../../../config/env.js';
import Logger from '../../../express-server/logger.js';

const userSchema = mongoose.Schema(
  {
    email: {
      type: String,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        '이메일 형식에 맞지 않습니다',
      ],
    },
    password: {
      type: String,
      minlength: [8, '비밀번호를 8자 이상 입력해주세요'],
      match: [
        /^(?=.*[a-z])(?=.*\d)[a-zA-Z\d]{8,20}$/,
        '비밀번호 형식에 맞지 않습니다',
      ],
    },
    name: {
      type: String,
      required: true,
      minlength: [2, '성함을 2글자 이상 입력해주세요'],
      maxlength: [52, '성함을 52글자 이하로 입력해주세요'],
    },
    socialInfo: {
      uuid: { type: String },
      organization: { type: String },
      refreshToken: { type: String },
    },
    isSocial: { type: Boolean, required: true, default: false },
    lastAccessTime: {
      // 마지막 접속 시간 -> 로그아웃 시
      type: Date,
    },
    isClosed: {
      // 탈퇴여부
      type: Boolean,
      required: true,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    createdAt: {
      type: Date,
      required: true,
      default: () => Date.now() + 9 * 60 * 60 * 1000,
    },
  },
  {
    versionKey: false,
  },
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  const password = await bcrypt.compare(enteredPassword, this.password);
  return password;
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(env.bcrypt.saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (e) {
    Logger.error(e.stack);
    return next(e);
  }
});

// hook명이 반드시 findOndAndUpdate이어야 동작한다.
userSchema.pre('findOneAndUpdate', async function (next) {
  const update = { ...this.getUpdate() };

  // Only run this function if password was modified
  if (!update.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(env.bcrypt.saltRounds);
    update.password = await bcrypt.hash(this.getUpdate().password, salt);
    this.setUpdate(update);
    return next();
  } catch (e) {
    Logger.error(e.stack);
    return next(e);
  }
});

const User = mongoose.model('User', userSchema);

export default User;
