import { User } from "@prisma/client";
import userRepository from "../repositories/userRepository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  NotFoundError,
  ServerError,
  ValidationError,
} from "../types/errors";

// 내부 함수들을 먼저 정의
export function hashPassword(password: NonNullable<User["password"]>) {
  return bcrypt.hash(password, 10);
}

export function filterSensitiveUserData(user: User) {
  const { password, refreshToken, ...rest } = user;
  return rest;
}

export async function verifyPassword(
  inputPassword: NonNullable<User["password"]>,
  password: NonNullable<User["password"]>,
) {
  const isMatch = await bcrypt.compare(inputPassword, password);
  if (!isMatch) {
    const error = new AuthenticationError("비밀번호가 일치하지 않습니다.");
    throw error;
  }
}

export function createToken(
  user: Omit<User, "password" | "refreshToken">,
  type?: "access" | "refresh",
) {
  const payload = { userId: user.id };
  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: type === "refresh" ? "2w" : "1h",
  });
  return token;
}

// 메인 서비스 함수들
async function createUser(user: Pick<User, "email" | "name" | "password">) {
  try {
    const existedUser = await userRepository.findByEmail(user.email);
    if (existedUser) {
      const error = new ValidationError("User already exists", {
        email: user.email,
      });
      throw error;
    }

    const hashedPassword = await hashPassword(user.password!);
    const createdUser = await userRepository.save({
      ...user,
      password: hashedPassword,
    });
    return filterSensitiveUserData(createdUser);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    const customError = new ServerError(
      "데이터베이스 작업 중 오류가 발생했습니다",
    );
    throw customError;
  }
}

async function getUser(
  email: User["email"],
  password: NonNullable<User["password"]>,
) {
  try {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const error = new AuthenticationError("존재하지 않는 이메일입니다.");
      throw error;
    }
    await verifyPassword(password, user.password!);
    return filterSensitiveUserData(user);
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    const customError = new ServerError(
      "데이터베이스 작업 중 오류가 발생했습니다",
    );
    throw customError;
  }
}

async function updateUser(
  id: User["id"],
  data: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>,
) {
  const updatedUser = await userRepository.update(id, data);
  return filterSensitiveUserData(updatedUser);
}

async function refreshToken(
  userId: User["id"],
  refreshToken: NonNullable<User["refreshToken"]>,
) {
  const user = await userRepository.findById(userId);
  if (!user || user.refreshToken !== refreshToken) {
    const error = new AuthenticationError("Unauthorized");
    throw error;
  }

  const newAccessToken = createToken(user);
  const newRefreshToken = createToken(user, "refresh");
  return { newAccessToken, newRefreshToken };
}

async function getUserById(id: User["id"]) {
  const user = await userRepository.findById(id);

  if (!user) {
    const error = new NotFoundError("Not Found");
    throw error;
  }

  return filterSensitiveUserData(user);
}

// 서비스 객체 생성
const userService = {
  createUser,
  getUser,
  createToken,
  updateUser,
  refreshToken,
  getUserById,
  hashPassword,
  filterSensitiveUserData,
  verifyPassword,
};

export default userService;
