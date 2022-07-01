import {
  injectedDataAccess,
  getDependency,
  setDependency,
} from '../infrastructure/config/injector.js';
import JwtManager from '../infrastructure/setup/security/jwtTokenManager.js';
import UserService from '../application/userService.js';
import UserController from './controllers/userController.js';

setDependency('jwtManger', JwtManager);

const repoBucket = injectedDataAccess();

setDependency('userService', new UserService(repoBucket.userRepository));
const userServiceInstance = getDependency('userService');
setDependency('userController', new UserController(userServiceInstance));
