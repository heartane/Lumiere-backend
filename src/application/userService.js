import bcrypt from 'bcrypt';
import serviceLocator from '../infrastructure/config/serviceLocator.js';
import {
  serializePagination,
  serializeSingleUserInfo,
} from '../interface/serializers/UserSerializer.js';
import env from '../infrastructure/config/env.js';
import Logger from '../setup/logger.js';
import localTime from '../utils/localTime.js';
import makeClassForTokenRequest from '../helpers/oAuth.js';
import { HTTP_STATUS } from '../infrastructure/config/constants.js';

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
    } else {
      return { status: HTTP_STATUS.OK, message: '사용 가능한 이메일입니다' };
    }
  }

  async register(userInfo) {
    // AuthService에서 bcrpt로 비밀번호 암호화
    try {
      const user = await this.userRepository.create(userInfo);
      return {
        status: HTTP_STATUS.CREATE,
        message: `회원가입 완료, ${user._id}`,
      };
    } catch (e) {
      Logger.error(e.stack);
      return { status: HTTP_STATUS.INTERNAL_ERROR, message: '유저 생성 오류' };
    }
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
    } else {
      return { ...statusCode, message: '비밀번호를 다시 확인해주세요' };
    }
  }

  async logout(userId) {
    try {
      const { lastAccessTime } = await this.userRepository.findByIdAndUpdate(
        userId,
        {
          lastAccessTime: localTime(),
        },
      );
      return {
        status: HTTP_STATUS.OK,
        message: `로그아웃 시간, ${lastAccessTime}`,
      };
    } catch (e) {
      Logger.error(e.stack);
    }
  }

  async socialLogin(corp, code) {
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

      const user = await this.userRepository.findSocialUser(userInfo);

      if (user) {
        return { status: HTTP_STATUS.OK, data: serializeSingleUserInfo(user) };
      } else {
        const newUser = await this.userRepository.create(userInfo);
        return {
          status: HTTP_STATUS.CREATE,
          data: serializeSingleUserInfo(newUser),
        };
      }
    } catch (e) {
      Logger.error(e.stack);
    }
  }

  async checkPassword(userId, password) {
    const user = await this.userRepository.findById(userId);

    if (user.isSocial) {
      return {
        status: HTTP_STATUS.FORBIDDEN,
        message: '소셜 유저는 변경이 불가합니다',
      };
    } else if (await user.matchPassword(password)) {
      return { status: HTTP_STATUS.OK, message: '비밀번호 일치' };
    } else {
      return { status: HTTP_STATUS.UNAUTHORIZED, message: '비밀번호 불일치' };
    }
  }

  async updatePassword(userId, password) {
    const hashedPassword = await bcrypt.hash(password, env.bcrypt.saltRounds);
    const updatedUser = await this.userRepository.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,
      },
      { new: true },
    );

    return {
      status: HTTP_STATUS.OK,
      data: serializeSingleUserInfo(updatedUser).token,
    };
  }

  async withdraw(jwtPayload, userId = null) {
    let targetId;

    jwtPayload.isAdmin ? (targetId = userId) : (targetId = jwtPayload.id);

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

      return {
        status: HTTP_STATUS.OK,
        message,
      };
    } catch (e) {
      Logger.error(e.stack);
    }
  }

  async getUsers(page) {
    const pageSize = env.pagination.pageSize;
    const filter = { isAdmin: false };
    const count = await this.userRepository.countDocuments(filter);
    const users = await this.userRepository.findUsers(pageSize, page, filter);

    return {
      status: HTTP_STATUS.OK,
      data: serializePagination(users, page, count, pageSize),
    };
  }
}

const userRepositoryInstance = serviceLocator().userRepository;
const userService = new UserService(userRepositoryInstance);

export default userService;
