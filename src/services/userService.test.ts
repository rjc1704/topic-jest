import userRepository from "../repositories/userRepository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  AuthenticationError,
  NotFoundError,
  ServerError,
  ValidationError,
} from "../types/errors";

// userRepository 모킹
jest.mock("../repositories/userRepository");
const mockedUserRepository = userRepository as jest.Mocked<
  typeof userRepository
>;

// bcrypt 모킹
jest.mock("bcrypt");
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// jsonwebtoken 모킹
jest.mock("jsonwebtoken");
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe("UserService", () => {
  let userService: typeof import("../services/userService").default;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    userService = require("../services/userService").default;
  });

  describe("createUser", () => {
    test("사용자 생성이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const userData = {
        email: "test@example.com",
        name: "Test User",
        password: "password123",
      };

      const hashedPassword = "hashedPassword123";
      const createdUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedUserRepository.findByEmail.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockedUserRepository.save.mockResolvedValue(createdUser);

      // Exercise
      const result = await userService.createUser(userData);

      // Assertion
      expect(mockedUserRepository.findByEmail).toHaveBeenCalledWith(
        userData.email,
      );
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockedUserRepository.save).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });
      expect(result).toEqual(expectedUser);
    });

    test("이미 존재하는 이메일인 경우 ValidationError를 반환해야 한다", async () => {
      // Setup
      const userData = {
        email: "existing@example.com",
        name: "Test User",
        password: "password123",
      };

      const existingUser = {
        id: 1,
        email: "existing@example.com",
        name: "Existing User",
        password: "hashedPassword",
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Exercise & Assertion
      await expect(userService.createUser(userData)).rejects.toThrow(
        ValidationError,
      );
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const userData = {
        email: "test@example.com",
        name: "Test User",
        password: "password123",
      };

      mockedUserRepository.findByEmail.mockRejectedValue(
        new Error("Database error"),
      );

      // Exercise & Assertion
      await expect(userService.createUser(userData)).rejects.toThrow(
        ServerError,
      );
    });
  });

  describe("getUser", () => {
    test("사용자 로그인이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const email = "test@example.com";
      const inputPassword = "password123";
      const hashedPassword = "hashedPassword123";

      const user = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedUserRepository.findByEmail.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Exercise
      const result = await userService.getUser(email, inputPassword);

      // Assertion
      expect(mockedUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        inputPassword,
        hashedPassword,
      );
      expect(result).toEqual(expectedUser);
    });

    test("존재하지 않는 이메일인 경우 AuthenticationError를 반환해야 한다", async () => {
      // Setup
      const email = "nonexistent@example.com";
      const password = "password123";

      mockedUserRepository.findByEmail.mockResolvedValue(null);

      // Exercise & Assertion
      await expect(userService.getUser(email, password)).rejects.toThrow(
        AuthenticationError,
      );
    });

    test("비밀번호가 일치하지 않는 경우 AuthenticationError를 반환해야 한다", async () => {
      // Setup
      const email = "test@example.com";
      const inputPassword = "wrongpassword";
      const hashedPassword = "hashedPassword123";

      const user = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedUserRepository.findByEmail.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Exercise & Assertion
      await expect(userService.getUser(email, inputPassword)).rejects.toThrow(
        AuthenticationError,
      );
    });
  });

  describe("createToken", () => {
    test("액세스 토큰이 성공적으로 생성되어야 한다", () => {
      // Setup
      const user = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedToken = "mock-access-token";
      mockedJwt.sign.mockImplementation(() => expectedToken);

      // Exercise
      const token = userService.createToken(user);

      // Assertion
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: user.id },
        "test-secret",
        { expiresIn: "1h" },
      );
      expect(token).toBe(expectedToken);
    });

    test("리프레시 토큰이 성공적으로 생성되어야 한다", () => {
      // Setup
      const user = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedToken = "mock-refresh-token";
      mockedJwt.sign.mockImplementation(() => expectedToken);

      // Exercise
      const token = userService.createToken(user, "refresh");

      // Assertion
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        { userId: user.id },
        "test-secret",
        { expiresIn: "2w" },
      );
      expect(token).toBe(expectedToken);
    });
  });

  describe("updateUser", () => {
    test("사용자 정보 업데이트가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const userId = 1;
      const updateData = {
        name: "Updated Name",
        refreshToken: "new-refresh-token",
      };

      const updatedUser = {
        id: 1,
        email: "test@example.com",
        name: "Updated Name",
        password: "hashedPassword",
        refreshToken: "new-refresh-token",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUser = {
        id: 1,
        email: "test@example.com",
        name: "Updated Name",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedUserRepository.update.mockResolvedValue(updatedUser);

      // Exercise
      const result = await userService.updateUser(userId, updateData);

      // Assertion
      expect(mockedUserRepository.update).toHaveBeenCalledWith(
        userId,
        updateData,
      );
      expect(result).toEqual(expectedUser);
    });
  });

  describe("refreshToken", () => {
    test("토큰 갱신이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const userId = 1;
      const refreshToken = "valid-refresh-token";

      const user = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        password: "hashedPassword",
        refreshToken: "valid-refresh-token",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newAccessToken = "new-access-token";
      const newRefreshToken = "new-refresh-token";

      mockedUserRepository.findById.mockResolvedValue(user);
      mockedJwt.sign
        .mockImplementationOnce(() => newAccessToken)
        .mockImplementationOnce(() => newRefreshToken);

      // Exercise
      const result = await userService.refreshToken(userId, refreshToken);

      // Assertion
      expect(mockedUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockedJwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        newAccessToken: newAccessToken,
        newRefreshToken: newRefreshToken,
      });
    });

    test("사용자가 존재하지 않는 경우 AuthenticationError를 반환해야 한다", async () => {
      // Setup
      const userId = 999;
      const refreshToken = "valid-refresh-token";

      mockedUserRepository.findById.mockResolvedValue(null);

      // Exercise & Assertion
      await expect(
        userService.refreshToken(userId, refreshToken),
      ).rejects.toThrow(AuthenticationError);
    });

    test("리프레시 토큰이 일치하지 않는 경우 AuthenticationError를 반환해야 한다", async () => {
      // Setup
      const userId = 1;
      const refreshToken = "invalid-refresh-token";

      const user = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        password: "hashedPassword",
        refreshToken: "different-refresh-token",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedUserRepository.findById.mockResolvedValue(user);

      // Exercise & Assertion
      await expect(
        userService.refreshToken(userId, refreshToken),
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe("getUserById", () => {
    test("사용자 조회가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const userId = 1;
      const user = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        password: "hashedPassword",
        refreshToken: "refresh-token",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedUserRepository.findById.mockResolvedValue(user);

      // Exercise
      const result = await userService.getUserById(userId);

      // Assertion
      expect(mockedUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedUser);
    });

    test("사용자가 존재하지 않는 경우 NotFoundError를 반환해야 한다", async () => {
      // Setup
      const userId = 999;
      mockedUserRepository.findById.mockResolvedValue(null);

      // Exercise & Assertion
      await expect(userService.getUserById(userId)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
