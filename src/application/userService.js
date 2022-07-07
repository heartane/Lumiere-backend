/* eslint-disable camelcase */
import serviceLocator from '../infrastructure/config/serviceLocator.js';
import {
  serializePagination,
  serializeSingleUserInfo,
} from '../interface/helper/serializer.js';
import config from '../infrastructure/config/env.js';
import makeClassForTokenRequest from '../interface/oauth/oAuth.js';
import { HTTP_STATUS } from '../infrastructure/config/constants.js';
import Logger from '../infrastructure/express-server/logger.js';
import localTime from '../utils/localTime.js';

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async checkEmail(email) {
    const userExists = await this.userRepository.findByEmail(email);

    if (userExists) {
      return {
        status: HTTP_STATUS.UNAUTHORIZED,
        message: '해당 이메일이 존재합니다',
      };
    }
    return { status: HTTP_STATUS.OK, message: '사용 가능한 이메일입니다' };
  }

  async register(userInfo) {
    let user;

    try {
      user = await this.userRepository.create(userInfo);
    } catch (e) {
      Logger.error(e.stack);
      return { status: HTTP_STATUS.INTERNAL_ERROR, message: '유저 생성 오류' };
    }
    return {
      status: HTTP_STATUS.CREATE,
      message: `회원가입 완료, ${user._id}`,
    };
  }

  async generalLogin(email, password) {
    const user = await this.userRepository.findByEmail(email);

    const statusCode = {
      status: HTTP_STATUS.UNAUTHORIZED,
    };

    if (!user) {
      return {
        ...statusCode,
        message: '이메일을 다시 확인해주세요',
      };
    }
    if (user.isClosed) {
      return {
        ...statusCode,
        message: '탈퇴한 회원입니다',
      };
    }
    if (await user.matchPassword(password)) {
      return { status: HTTP_STATUS.OK, data: serializeSingleUserInfo(user) };
    }
    return { ...statusCode, message: '비밀번호를 다시 확인해주세요' };
  }

  async logout(userId) {
    let lastAccessTime;
    try {
      ({ lastAccessTime } = await this.userRepository.findByIdAndUpdate(
        userId,
        {
          lastAccessTime: localTime(),
        },
      ));
    } catch (e) {
      Logger.error(e.stack);
    }
    return {
      status: HTTP_STATUS.OK,
      message: `로그아웃 시간, ${lastAccessTime}`,
    };
  }

  async socialLogin(corp, code) {
    let user;
    try {
      const corpOptions = makeClassForTokenRequest(corp, code);
      const token = await corpOptions.getAccessToken();

      const { uuid, email, name } = await corpOptions.setUserInfo(token);
      const { refresh_token } = token;

      const userInfo = {
        corp,
        uuid: String(uuid),
        email,
        name,
        refresh_token,
      };

      user = await this.userRepository.findSocialUser(userInfo);

      if (user) {
        return { status: HTTP_STATUS.OK, data: serializeSingleUserInfo(user) };
      }
      user = await this.userRepository.create(userInfo);
    } catch (e) {
      Logger.error(e.stack);
    }
    return {
      status: HTTP_STATUS.CREATE,
      data: serializeSingleUserInfo(user),
    };
  }

  async checkPassword(userId, password) {
    const user = await this.userRepository.findById(userId);

    if (user.isSocial) {
      return {
        status: HTTP_STATUS.FORBIDDEN,
        message: '소셜 유저는 변경이 불가합니다',
      };
    }
    if (await user.matchPassword(password)) {
      return { status: HTTP_STATUS.OK, message: '비밀번호 일치' };
    }
    return { status: HTTP_STATUS.UNAUTHORIZED, message: '비밀번호 불일치' };
  }

  async updatePassword(userId, password) {
    const updatedUser = await this.userRepository.findByIdAndUpdate(userId, {
      password,
    });

    return {
      status: HTTP_STATUS.OK,
      data: serializeSingleUserInfo(updatedUser).token,
    };
  }

  async withdraw(jwtPayload, userId = null) {
    const targetId = jwtPayload.isAdmin ? userId : jwtPayload.id;

    let message = '일반 유저 탈퇴 완료';
    try {
      const user = await this.userRepository.findById(targetId);

      if (user.isSocial) {
        const { organization, refreshToken } = user.socialInfo;

        const corpOptions = makeClassForTokenRequest(
          organization,
          refreshToken,
        );
        message = await corpOptions.revokeAccess();
      }
      await this.userRepository.delete(targetId, user.isSocial);
    } catch (e) {
      Logger.error(e.stack);
    }
    return {
      status: HTTP_STATUS.OK,
      message,
    };
  }

  async getUsers(page) {
    const { pageSize } = config.pagination;
    const filter = { isAdmin: false };
    const count = await this.userRepository.countDocuments(filter);
    const users = await this.userRepository.findUsers(pageSize, page, filter);

    return {
      status: HTTP_STATUS.OK,
      data: serializePagination({ users }, page, count, pageSize),
    };
  }
}

const userRepositoryInstance = serviceLocator().userRepository;
const userService = new UserService(userRepositoryInstance);

export default userService;
