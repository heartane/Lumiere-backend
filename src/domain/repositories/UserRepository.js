/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */
export default class UserRepository {
  constructor(Entity) {
    this.entity = Entity;
  }

  findByEmail(email) {
    throw new Error('ERR_METHOD_SHOULD_OVERRIDE');
  }

  findById(userId) {
    throw new Error('ERR_METHOD_SHOULD_OVERRIDE');
  }

  create(userEntity) {
    throw new Error('ERR_METHOD_SHOULD_OVERRIDE');
  }
}
