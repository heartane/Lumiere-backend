import serviceLocator from '../infrastructure/config/serviceLocator.js';

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }
  async findByEmail(email) {
    return await this.userRepository.findByEmail(email);
  }

  async findById(userId) {
    return await this.userRepository.findById(userId);
  }

  async create(userInfo) {
    return await this.userRepository.create(userInfo);
  }

  async logLastAccessTime(userId) {
    return await this.userRepository.logLastAccessTime(userId);
  }

  async findSocialUser(userInfo) {
    return await this.userRepository.findSocialUser(userInfo);
  }

  async updatePassword(userId, password) {
    return await this.userRepository.updatePassword(userId, password);
  }

  async delete(userId, corp = undefined) {
    return await this.userRepository.delete(userId, corp);
  }

  async countDocs(filter) {
    return await this.userRepository.countDocs(filter);
  }

  async findUsers(pageSize, page, filter) {
    return await this.userRepository.findUsers(pageSize, page, filter);
  }
}

const userRepositoryInstance = serviceLocator().userRepository;
const userService = new UserService(userRepositoryInstance);

export default userService;
