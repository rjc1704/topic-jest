import express from "express";
import userService from "../services/userService.js";
import auth from "../middlewares/auth.js";
import passport from "../config/passport.js";

const userController = express.Router();

userController.post("/users", async (req, res, next) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      const error = new Error("email, name, password 가 모두 필요합니다.");
      error.code = 422;
      throw error;
    }
    const user = await userService.createUser({ email, name, password });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

userController.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      const error = new Error("email, password 가 모두 필요합니다.");
      error.code = 422;
      throw error;
    }
    const user = await userService.getUser(email, password);

    const accessToken = userService.createToken(user);
    const refreshToken = userService.createToken(user, "refresh");
    await userService.updateUser(user.id, { refreshToken });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    res.json({ ...user, accessToken });
  } catch (error) {
    next(error);
  }
});

// TODO: passport local strategy 를 이용해서 로그인 처리하도록 리팩터링 하세요
userController.post(
  "/session-login",
  auth.validateEmailAndPassword,
  passport.authenticate("local"),
  (req, res) => {
    res.json(req.user);
  },
);

userController.post(
  "/token/refresh",
  auth.verifyRefreshToken,
  async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      const { userId } = req.auth;
      const { newAccessToken, newRefreshToken } =
        await userService.refreshToken(userId, refreshToken);
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/token/refresh",
      });
      return res.json({ accessToken: newAccessToken });
    } catch (error) {
      return next(error);
    }
  },
);

export default userController;
