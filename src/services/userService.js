import userRepository from "../repositories/userRepository.js";

async function createUser(user) {
  // TODO: 회원가입 로직 구현
  // 1. 이메일 중복 여부 확인
  // 2. 이메일 중복 시 422 코드로 응답
  // 3. 이메일 중복 아니면 회원가입 진행
  // 4. 회원가입 성공 시 password 제외한 유저 데이터 반환
  // 5. 회원가입 실패 시 error.data 에는 { email: user.email } 형식으로 전달
  // 6. 회원가입 실패 시 error.code 에는 422 코드 전달
  const existedUser = await userRepository.findByEmail(user.email);
  try {
    if (existedUser) {
      const error = new Error("User already exists");
      error.code = 422;
      error.data = { email: user.email };
      throw error;
    }

    const createdUser = await userRepository.save({ ...user });
    return filterSensitiveUserData(createdUser);
  } catch (error) {
    if (error.code === 422) throw error; // 기존의 중복 체크 에러는 그대로 전달

    // Prisma 에러를 애플리케이션에 맞는 형식으로 변환
    const customError = new Error("데이터베이스 작업 중 오류가 발생했습니다");
    customError.code = 500;
    throw customError;
  }
}

function filterSensitiveUserData(user) {
  const { password, ...rest } = user;
  return rest;
}

export default {
  createUser,
};
