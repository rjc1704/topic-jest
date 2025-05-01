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

  if (existedUser) {
    const error = new Error("User already exists");
    error.code = 422;
    error.data = { email: user.email };
    throw error;
  }

  const createdUser = await userRepository.save({ ...user });
  return filterSensitiveUserData(createdUser);
}

function filterSensitiveUserData(user) {
  const { password, ...rest } = user;
  return rest;
}

export default {
  createUser,
};
