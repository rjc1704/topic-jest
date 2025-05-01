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

// TODO: 로그인 Endpoint 구현
userController.post("/login", async (req, res, next) => {
  try {
    // 1. 요청 바디에서 로그인시 필요한 email, password 추출
    // 2. 각 속성이 없으면 422 코드와 "email, password 가 모두 필요합니다." 에러메시지로 에러 발생
    // 3. userService 에서 getUser 호출
    // 4. 로그인 성공 시 200 코드로 응답와 함께 로그인한 유저 데이터 반환
    // 5. 로그인 실패 시 에러핸들러로 에러 전달 (이미 구현되어 있음)
  } catch (error) {
    next(error);
  }
});

export default userController;
