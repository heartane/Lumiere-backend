import express from 'express';
import { protect, admin } from '../../infrastructure/setup/middlewares/auth.js';

const router = express.Router();

// endpoint => /api/users
export default function usersRouter(userController) {
  router
    .route('/')
    .post(userController.register)
    .get(protect, admin, userController.getUsers);

  router.route('/email').post(userController.checkEmail);
  router.route('/login').post(userController.generalLogin);
  router.route('/logout').get(protect, userController.logout);
  router.route('/:corp').get(userController.oAuthLogin);

  router
    .route('/profile')
    .post(protect, userController.checkPassword)
    .patch(protect, userController.updatePassword)
    .delete(protect, userController.withdraw);
  return router;
}

/* 
디커플링을 위해 라우트 리팩토링
함수에서 DI를 적용했다.

파라미터로 전달된 userController는 메소드들 내부에서 참조값으로 사용하고 있다.
(this.userService.checkemail과 같이)
그런데 라우터에서 이렇게 참조 대상을 직접 전달하면, 메소드는 기존 this를 잊어버린다.

userController 생성자 함수 내에서 bind를 명시해 줄 수도 있고,
가장 쉽게 이를 해결하는 방법은 바로 화살표 함수!
자신만의 this를 갖지않고, 자신이 속한 상위(클래스, 함수)를 참조해서 자동으로 바인딩이 된다.!
따라서 안전하게 사용할 수 있다.
*/
