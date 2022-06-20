import User from '../../models/user.js';
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
}

export async function findById(userId) {
  return await User.findById(userId);
}

export async function createUser(userInfo, type) {
  const user = new User({ ...userInfo });

  if (type === 'general') {
    user.markModified('general');
  }
  await user.save();

  return user;
}

export async function logLastAccessTime(userId) {
  const user = await User.findByIdAndUpdate(
    { _id: userId },
    { 'active.lastAccessTime': localTime() },
    {
      upsert: true,
      new: true,
    },
  );
  return user.active.lastAccessTime;
}

export async function updatePassword(userId, password) {
  return await User.findByIdAndUpdate(
    userId,
    { 'general.password': password },
    {
      new: true,
    },
  );
}

export async function findSocialUser(corp, userInfo) {
  const { uuid, email, access_token, refresh_token } = userInfo;
  return await User.findOneAndUpdate(
    {
      [`${corp}.uuid`]: uuid,
    },
    {
      [`${corp}.email`]: email,
      [`${corp}.accessToken`]: access_token,
      [`${corp}.refreshToken`]: refresh_token,
      'active.isClosed': false,
    },
    { new: true },
  );
}

export async function blockOff(userId, type, corp = undefined) {
  let query;
  if (type === 'social') {
    query = {
      [`${corp}.accessToken`]: 1,
      [`${corp}.refreshToken`]: 1,
    };
  } else {
    query = { 'general.password': 1 };
  }

  return await User.findOneAndUpdate(
    { _id: userId },
    {
      'active.lastAccessTime': localTime(),
      'active.isClosed': true,
      $unset: { ...query },
    },
    { new: true, upsert: true },
  );
}

export async function countDocs(filter) {
  return await User.countDocuments({ ...filter });
}

export async function findUsers(pageSize, page, filter) {
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
    .exec();
}
