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
}

const userRepositoryInstance = serviceLocator().userRepository;
const userService = new UserService(userRepositoryInstance);

export default userService;
