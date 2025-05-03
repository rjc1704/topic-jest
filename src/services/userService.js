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

// TODO: user 데이터에서 refreshToken 도 제외하고 반환하도록 수정하세요
function filterSensitiveUserData(user) {
  const { password, ...rest } = user;
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
// TODO: 두 번째 매개변수로 type 을 추가하세요
// type 이 "refresh" 일 때는 2주, "access" 일 때는 1시간으로 설정
function createToken(user) {
  const payload = { userId: user.id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
}

// TODO: updateUser 함수를 완성하세요
async function updateUser(id, data) {
  // userRepository 에서 적절한 함수를 찾아 호출하세요
  return;
}

// TODO: 토큰 갱신 함수를 완성하세요
async function refreshToken(userId, refreshToken) {
  // userId 를 통해 데이터베이스에서 사용자 정보를 가져옵니다.
  // DB 에서 가져온 user 정보가 없거나
  // 사용자가 전달한 refreshToken 과 DB 에 저장된 refreshToken 이 일치하지 않으면
  // 401 Unauthorized 에러를 발생시키세요
  // 위 단계를 모두 통과했으면 새로운 accessToken 을 발급하여 반환하세요
  return;
}

export default {
  createUser,
  getUser,
  createToken,
  updateUser,
  refreshToken,
};
