import express from "express";
import userService from "../services/userService.js";

const userController = express.Router();

// TODO: 회원가입 Endpoint 구현
userController.post("/users", async (req, res, next) => {
  // 1. 요청 바디에서 회원가입시 필요한 각 항목들 추출
  // 2. 각 속성이 없으면 422 코드와 "속성1,속성2,속성3 가 모두 필요합니다." 에러메시지로 에러 발생
  // 3. userService 에서 createUser 호출
  // 4. 회원가입 성공 시 201 코드로 응답
  // 5. 회원가입 실패 시 에러핸들러로 에러 전달
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

export default userController;
