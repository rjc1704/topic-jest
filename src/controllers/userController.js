import express from "express";
import userService from "../services/userService.js";

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
    // TODO: 로그인 성공 시 토큰 발급하여 user 정보와 함께 accessToken 을 응답
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// TODO: 세션 로그인 Endpoint 구현
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
export default userController;
