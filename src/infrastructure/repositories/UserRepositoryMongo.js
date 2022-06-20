import User from '../database/mongo/models/user.js';
import localTime from '../../utils/localTime.js';
import UserRepository from '../../domain/repositories/UserRepository.js';

export class UserRepositoryMongo extends UserRepository {
  constructor() {
    super();
  }
  async findByEmail(email) {
    return await User.findOne({ 'general.email': email });
  }

  async findById(userId) {
    return await User.findById(userId);
  }

  async create(userInfo) {
    let user;

    if (userInfo.corp) {
      user = new User({
        [`${corp}.uuid`]: userInfo.uuid,
        [`${corp}.email`]: userInfo.email,
        [`${corp}.refreshToken`]: userInfo.refresh_token,
        name: userInfo.name,
      });
    } else {
      user = new User({
        general: { email: userInfo.email, password: userInfo.password },
        name: userInfo.name,
      });
      user.markModified('general');
    }
    await user.save();

    return user;
  }

  async logLastAccessTime(userId) {
    const user = await User.findByIdAndUpdate(
      { _id: userId },
      { 'active.lastAccessTime': localTime() },
      {
        upsert: true,
        new: true,
      },
    ).lean();
    return user.active.lastAccessTime;
  }

  async findSocialUser(userInfo) {
    const { uuid, email, name, corp, refresh_token } = userInfo;

    return await User.findOneAndUpdate(
      {
        [`${corp}.uuid`]: uuid,
      },
      {
        [`${corp}.email`]: email,
        [`${corp}.refreshToken`]: refresh_token,
        name,
        'active.isClosed': false,
      },
      { new: true },
    ).lean();
  }

  async updatePassword(userId, password) {
    return await User.findByIdAndUpdate(
      userId,
      { 'general.password': password },
      {
        new: true,
      },
    ).lean();
  }

  async delete(userId, corp = undefined) {
    let query;

    corp
      ? (query = {
          [`${corp}.refreshToken`]: 1,
        })
      : (query = { 'general.password': 1 });

    return await User.findOneAndUpdate(
      { _id: userId },
      {
        'active.lastAccessTime': localTime(),
        'active.isClosed': true,
        $unset: query,
      },
      { new: true, upsert: true },
    );
  }

  async countDocs(filter) {
    return await User.countDocuments({ ...filter }).lean();
  }

  async findUsers(pageSize, page, filter) {
    return await User.find(
      { ...filter },
      {
        isAdmin: 0,
        'general.password': 0,
        'google.accessToken': 0,
        'naver.accessToken': 0,
        'kakao.accessToken': 0,
        'google.refreshToken': 0,
        'naver.refreshToken': 0,
        'kakao.refreshToken': 0,
      },
    )
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .lean()
      .exec();
  }
}
