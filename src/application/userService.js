/* eslint-disable camelcase */
export default class UserService {
  #userRepository;

  constructor(userRepository, logger) {
    this.#userRepository = userRepository;
    this.logger = logger;
  }

  async checkEmail(email) {
    return await this.#userRepository.findByEmail(email);
  }

  async register(userInfo) {
    try {
      const user = await this.#userRepository.create(userInfo);
      return user._id;
    } catch (e) {
      this.logger.error(e.stack);
    }
    return null;
  }

  async generalLogin(email, password) {
    try {
      const user = await this.#userRepository.findByEmail(email);
      if (!user || user.isClosed) return null;
      if (await user.matchPassword(password)) return user;
    } catch (e) {
      this.logger.error(e.stack);
    }
    return null;
  }

  async logout(userId) {
    try {
      const user = await this.#userRepository.logLastAccessTime(userId);
      return user.lastAccessTime;
    } catch (e) {
      this.logger.error(e.stack);
    }
    return null;
  }

  async socialLogin(corp, code, oAuthFactory) {
    try {
      const corpOptions = oAuthFactory(corp, code, this.logger);
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

      const user = await this.#userRepository.findSocialUser(userInfo);

      return user || (await this.#userRepository.create(userInfo));
    } catch (e) {
      this.logger.error(e.stack);
    }
    return null;
  }

  async checkPassword(userId, password) {
    const user = await this.#userRepository.findById(userId);

    return user.isSocial ? null : await user.matchPassword(password);
  }

  async updatePassword(userId, password) {
    return await this.#userRepository.updatePassword(userId, password);
  }

  async withdraw(jwtPayload, oAuthFactory, userId) {
    // 유저 본인이 탈퇴 요청 / 관리자가 탈퇴 요청

    const targetId = jwtPayload.isAdmin ? userId : jwtPayload.id;

    try {
      const user = await this.#userRepository.findById(targetId);

      if (user.isSocial) {
        // 소셜 유저 연결끊기
        const { organization, refreshToken } = user.socialInfo;
        const corpOptions = oAuthFactory(
          organization,
          refreshToken,
          this.logger,
        );
        await corpOptions.revokeAccess();
      }
      // DB 데이터 정리
      return await this.#userRepository.deleteCredentials(
        targetId,
        user.isSocial,
      );
    } catch (e) {
      this.logger.error(e.stack);
    }
    return null;
  }

  async getUsers(page, pageSize) {
    try {
      const count = await this.#userRepository.countDocuments();
      const users = await this.#userRepository.findUsers(pageSize, page);
      return { users, count };
    } catch (e) {
      this.logger.error(e.stack);
    }
    return null;
  }
}
