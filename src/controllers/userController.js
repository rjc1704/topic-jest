import express from "express";
import userService from "../services/userService.js";
import auth from "../middlewares/auth.js";

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

userController.post("/session-login", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      const error = new Error("email, password 가 모두 필요합니다.");
      error.code = 422;
      throw error;
    }
    const user = await userService.getUser(email, password);
    req.session.userId = user.id;
    res.json(user);
  } catch (error) {
    next(error);
  }
});

userController.post(
  "/token/refresh",
  auth.verifyRefreshToken,
  async (req, res, next) => {
    try {
      // const authHeader = req.headers["authorization"];
      // const refreshToken = authHeader.split(" ")[1];
      const refreshToken = req.cookies.refreshToken;
      const { userId } = req.auth;
      const accessToken = await userService.refreshToken(userId, refreshToken);
      return res.json({ accessToken });
    } catch (error) {
      return next(error);
    }
  },
);

export default userController;
