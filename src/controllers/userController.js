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
    // TODO: accessToken 발급할 때 refreshToken 도 발급하세요
    // 발급한 refreshToken 을 응답에 포함시키세요
    const accessToken = userService.createToken(user);
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

// TODO: 토큰 갱신 Endpoint 를 추가하세요

export default userController;
