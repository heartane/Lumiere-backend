import express from 'express';
import {
  generalLogin,
  oAuthLogin,
  register,
  checkEmail,
  checkPassword,
  updatePassword,
  logout,
  withdraw,
  getUsers,
} from '../controllers/userController.js';
import { protect, admin } from '../../middlewares/auth.js';

const router = express.Router();

// endpoint => /api/users
router.route('/').post(register).get(protect, admin, getUsers);
router.route('/email').post(checkEmail);
router.route('/login').post(generalLogin);
router.route('/logout').get(protect, logout);
router.route('/:corp').get(oAuthLogin);

router
  .route('/profile')
  .post(protect, checkPassword)
  .patch(protect, updatePassword)
  .delete(protect, withdraw);

export default router;
