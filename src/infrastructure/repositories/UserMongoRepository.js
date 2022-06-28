import localTime from '../../utils/localTime.js';
import UserRepository from '../../domain/repositories/UserRepository.js';
import Logger from '../setup/logger.js';

export class UserMongoRepository extends UserRepository {
  constructor(User) {
    super(User);
    this.user = User;
  }
  async findByEmail(email) {
    return await this.user.findOne({ email });
  }

  async findById(userId) {
    return await this.user.findById(userId);
  }

  async create(userInfo) {
    const { email, password, name, corp, uuid, refresh_token } = userInfo;

    let user;

    try {
      if (uuid) {
        user = await this.user.create({
          email,
          name,
          socialInfo: {
            uuid,
            refreshToken: refresh_token,
            organization: corp,
          },
          isSocial: true,
        });
      } else {
        user = await this.user.create({
          email,
          name,
          password,
        });
      }
      return user;
    } catch (e) {
      Logger.error(e.stack);
    }
  }

  async findByIdAndUpdate(userId, updateQuery, queryOptions = { new: true }) {
    const user = await this.user
      .findByIdAndUpdate(userId, updateQuery, queryOptions)
      .lean();
    return user;
  }

  async findSocialUser(userInfo) {
    const { uuid, email, name, refresh_token } = userInfo;

    return await this.user
      .findOneAndUpdate(
        { 'socialInfo.uuid': uuid },
        {
          email,
          name,
          'socialInfo.refreshToken': refresh_token,
          isClosed: false,
        },
        { new: true },
      )
      .lean();
  }

  async delete(userId, isSocial) {
    let query;

    isSocial
      ? (query = {
          'socialInfo.refreshToken': 1,
        })
      : (query = { password: 1 });

    return await this.user.findByIdAndUpdate(
      userId,
      {
        lastAccessTime: localTime(),
        isClosed: true,
        $unset: query,
      },
      { new: true, upsert: true },
    );
  }

  async countDocuments(filter) {
    return await this.user.countDocuments({ ...filter }).lean();
  }

  async findUsers(pageSize, page, filter) {
    return await this.user
      .find(
        { ...filter },
        {
          isAdmin: 0,
          password: 0,
          'socialInfo.uuid': 0,
          'socialInfo.refreshToken': 0,
        },
      )
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .lean()
      .exec();
  }
}
