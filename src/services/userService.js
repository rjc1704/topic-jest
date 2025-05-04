import userRepository from "../repositories/userRepository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
async function createUser(user) {
  try {
    const existedUser = await userRepository.findByEmail(user.email);
    if (existedUser) {
      const error = new Error("User already exists");
      error.code = 422;
      error.data = { email: user.email };
      throw error;
    }

    const hashedPassword = await hashPassword(user.password);
    const createdUser = await userRepository.save({
      ...user,
      password: hashedPassword,
    });
    return filterSensitiveUserData(createdUser);
  } catch (error) {
    if (error.code === 422) throw error; // 기존의 중복 체크 에러는 그대로 전달

    // Prisma 에러를 애플리케이션에 맞는 형식으로 변환
    const customError = new Error("데이터베이스 작업 중 오류가 발생했습니다");
    customError.code = 500;
    throw customError;
  }
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function filterSensitiveUserData(user) {
  const { password, refreshToken, ...rest } = user;
  return rest;
}

async function getUser(email, password) {
  try {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new Error("존재하지 않는 이메일입니다.");
      error.code = 401;
      throw error;
    }
    await verifyPassword(password, user.password);
    return filterSensitiveUserData(user);
  } catch (error) {
    if (error.code === 401) throw error;
    const customError = new Error("데이터베이스 작업 중 오류가 발생했습니다");
    customError.code = 500;
    throw customError;
  }
}

async function verifyPassword(inputPassword, password) {
  const isMatch = await bcrypt.compare(inputPassword, password);
  // const isMatch = inputPassword === password;
  if (!isMatch) {
    const error = new Error("비밀번호가 일치하지 않습니다.");
    error.code = 401;
    throw error;
  }
}

function createToken(user, type) {
  const payload = { userId: user.id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: type === "refresh" ? "2w" : "1h",
  });
  return token;
}

// TODO: updateUser 함수를 완성하세요
async function updateUser(id, data) {
  // userRepository 에서 적절한 함수를 찾아 호출하세요
  const updatedUser = await userRepository.update(id, data);
  return filterSensitiveUserData(updatedUser);
}

async function refreshToken(userId, refreshToken) {
  const user = await userRepository.findById(userId);
  if (!user || user.refreshToken !== refreshToken) {
    const error = new Error("Unauthorized");
    error.code = 401;
    throw error;
  }
  // TODO: refreshToken 도 새로 발급하고, 리턴값에 포함시키세요.
  // hint: 객체형태로 반환하세요
  const newAccessToken = createToken(user);
  return newAccessToken;
}

export default {
  createUser,
  getUser,
  createToken,
  updateUser,
  refreshToken,
};
