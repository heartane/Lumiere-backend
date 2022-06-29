import asyncHandler from 'express-async-handler';

export default class UserController {
  #userService;

  constructor(userService) {
    this.#userService = userService;
  }

  // @desc   Check a email address
  // @route  POST /api/users/email
  // @access Public
  checkEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const { status, message, data } = await this.#userService.checkEmail(email);
    res.status(status).json({ message, data });
  });

  // @desc   Register a new general user
  // @route  POST /api/users
  // @access Public
  register = asyncHandler(async (req, res) => {
    const userInfo = req.body;

    const { status, message, data } = await this.#userService.register(
      userInfo,
    );
    res.status(status).json({ message, data });
  });

  // @desc   Auth & get token for general user
  // @route  POST /api/users/login
  // @access Public
  generalLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { status, message, data } = await this.#userService.generalLogin(
      email,
      password,
    );

    if (message) {
      res.status(status).json({ message, data });
    } else res.status(status).json(data);
  });

  // @desc   Log user logout time
  // @route  GET /api/users/logout
  // @access Private
  logout = asyncHandler(async (req, res) => {
    const { status, message } = await this.#userService.logout(req.user.id);

    res.status(status).json({ message });
  });

  // @desc   Fetch token & userInfo from corporations
  // @route  GET /api/users/:corp
  // @access Public
  oAuthLogin = asyncHandler(async (req, res) => {
    const { corp } = req.params;
    const { code } = req.query;

    const { status, data } = await this.#userService.socialLogin(corp, code);

    res.status(status).json(data);
  });

  // @desc   Check user password
  // @route  POST /api/users/profile
  // @access Private
  checkPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;

    const { status, message } = await this.#userService.checkPassword(
      req.user.id,
      password,
    );
    res.status(status).json({ message });
  });

  // @desc   Update user password
  // @route  PATCH /api/users/profile
  // @access Private
  updatePassword = asyncHandler(async (req, res) => {
    const { password } = req.body;

    const { status, message, data } = await this.#userService.updatePassword(
      req.user.id,
      password,
    );

    res.status(status).json({
      message,
      token: data,
    });
  });

  // @desc   Delete user profile
  // @route  DELETE /api/users/profile
  // @access Private & Private/Admin
  withdraw = asyncHandler(async (req, res) => {
    // 유저 본인이 탈퇴 요청 / 관리자가 탈퇴 요청

    const { status, message } = await this.#userService.withdraw(
      req.user,
      req.query.userId,
    );

    res.status(status).json({ message });
  });

  // @desc   Get all users except admin
  // @route  GET /api/users
  // @access Private/Admin
  getUsers = asyncHandler(async (req, res) => {
    const page = Number(req.query.pageNumber) || 1;

    const { status, data } = await this.#userService.getUsers(page);

    res.status(status).json(data);
  });
}
