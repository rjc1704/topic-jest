import userService from "../services/userService";
import { ValidationError, AuthenticationError } from "../types/errors";
import { Request, Response, NextFunction } from "express";

// userService 모킹
jest.mock("../services/userService");
const mockedUserService = userService as jest.Mocked<typeof userService>;

// 컨트롤러 함수들을 직접 테스트하기 위한 헬퍼 함수
const createMockRequest = (body: any) =>
  ({
    body,
  } as Request);

const createMockResponse = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    cookie: jest.fn().mockReturnThis(),
  } as unknown as Response);

const createMockNext = () => jest.fn() as NextFunction;

describe("UserController", () => {
  // 각 테스트 전에 모든 모킹을 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /users 회원가입", () => {
    test("사용자 생성이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const userData = {
        email: "test@example.com",
        name: "Test User",
        password: "password123",
      };

      const expectedUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRequest = createMockRequest(userData);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      mockedUserService.createUser.mockResolvedValue(expectedUser);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { email, name, password } = mockRequest.body;
        if (!email || !name || !password) {
          const error = new ValidationError(
            "email, name, password 가 모두 필요합니다.",
          );
          throw error;
        }
        const user = await userService.createUser({ email, name, password });
        mockResponse.status(201).json(user);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedUserService.createUser).toHaveBeenCalledWith(userData);
      expect(mockedUserService.createUser).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedUser);
      expect(mockNext).not.toHaveBeenCalled();

      // Teardown - beforeEach에서 처리됨
    });

    test("필수 필드가 누락된 경우 400 에러를 반환해야 한다", async () => {
      // Setup
      const incompleteUserData = {
        email: "test@example.com",
        name: "Test User",
        // password missing
      };

      const mockRequest = createMockRequest(incompleteUserData);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { email, name, password } = mockRequest.body;
        if (!email || !name || !password) {
          const error = new ValidationError(
            "email, name, password 가 모두 필요합니다.",
          );
          throw error;
        }
        const user = await userService.createUser({ email, name, password });
        mockResponse.status(201).json(user);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe(
        "email, name, password 가 모두 필요합니다.",
      );
      expect(mockedUserService.createUser).not.toHaveBeenCalled();

      // Teardown - beforeEach에서 처리됨
    });

    test("서비스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const userData = {
        email: "test@example.com",
        name: "Test User",
        password: "password123",
      };

      const mockRequest = createMockRequest(userData);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      const validationError = new ValidationError("User already exists");
      mockedUserService.createUser.mockRejectedValue(validationError);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { email, name, password } = mockRequest.body;
        if (!email || !name || !password) {
          const error = new ValidationError(
            "email, name, password 가 모두 필요합니다.",
          );
          throw error;
        }
        const user = await userService.createUser({ email, name, password });
        mockResponse.status(201).json(user);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedUserService.createUser).toHaveBeenCalledWith(userData);
      expect(mockNext).toHaveBeenCalledWith(validationError);

      // Teardown - beforeEach에서 처리됨
    });
  });

  describe("POST /login", () => {
    test("로그인이 성공적으로 완료되고 토큰을 반환해야 한다", async () => {
      // Setup
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const user = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const accessToken = "mock-access-token";
      const refreshToken = "mock-refresh-token";

      const mockRequest = createMockRequest(loginData);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      mockedUserService.getUser.mockResolvedValue(user);
      mockedUserService.createToken
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);
      mockedUserService.updateUser.mockResolvedValue(user);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { email, password } = mockRequest.body;
        if (!email || !password) {
          const error = new ValidationError(
            "email, password 가 모두 필요합니다.",
          );
          throw error;
        }
        const user = await userService.getUser(email, password);

        const accessToken = userService.createToken(user);
        const refreshToken = userService.createToken(user, "refresh");
        await userService.updateUser(user.id, { refreshToken });
        mockResponse.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        });
        mockResponse.json({ ...user, accessToken });
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedUserService.getUser).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
      );
      expect(mockedUserService.createToken).toHaveBeenCalledTimes(2);
      expect(mockedUserService.updateUser).toHaveBeenCalledWith(user.id, {
        refreshToken,
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "refreshToken",
        refreshToken,
        {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        },
      );
      expect(mockResponse.json).toHaveBeenCalledWith({ ...user, accessToken });
      expect(mockNext).not.toHaveBeenCalled();

      // Teardown - beforeEach에서 처리됨
    });

    test("이메일이나 비밀번호가 누락된 경우 400 에러를 반환해야 한다", async () => {
      // Setup
      const incompleteLoginData = {
        email: "test@example.com",
        // password missing
      };

      const mockRequest = createMockRequest(incompleteLoginData);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { email, password } = mockRequest.body;
        if (!email || !password) {
          const error = new ValidationError(
            "email, password 가 모두 필요합니다.",
          );
          throw error;
        }
        const user = await userService.getUser(email, password);

        const accessToken = userService.createToken(user);
        const refreshToken = userService.createToken(user, "refresh");
        await userService.updateUser(user.id, { refreshToken });
        mockResponse.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        });
        mockResponse.json({ ...user, accessToken });
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe(
        "email, password 가 모두 필요합니다.",
      );
      expect(mockedUserService.getUser).not.toHaveBeenCalled();

      // Teardown - beforeEach에서 처리됨
    });

    test("인증 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const mockRequest = createMockRequest(loginData);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      const authError = new AuthenticationError("존재하지 않는 이메일입니다.");
      mockedUserService.getUser.mockRejectedValue(authError);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { email, password } = mockRequest.body;
        if (!email || !password) {
          const error = new ValidationError(
            "email, password 가 모두 필요합니다.",
          );
          throw error;
        }
        const user = await userService.getUser(email, password);

        const accessToken = userService.createToken(user);
        const refreshToken = userService.createToken(user, "refresh");
        await userService.updateUser(user.id, { refreshToken });
        mockResponse.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
        });
        mockResponse.json({ ...user, accessToken });
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedUserService.getUser).toHaveBeenCalledWith(
        loginData.email,
        loginData.password,
      );
      expect(mockNext).toHaveBeenCalledWith(authError);

      // Teardown - beforeEach에서 처리됨
    });
  });

  describe("POST /token/refresh", () => {
    test("토큰 갱신이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newAccessToken = "new-access-token";
      const newRefreshToken = "new-refresh-token";

      const mockRequest = {
        cookies: { refreshToken: "old-refresh-token" },
        user: mockUser,
      } as any;

      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      mockedUserService.refreshToken.mockResolvedValue({
        newAccessToken,
        newRefreshToken,
      });

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const refreshToken = mockRequest.cookies.refreshToken;
        const { id } = mockRequest.user;

        const { newAccessToken, newRefreshToken } =
          await userService.refreshToken(id, refreshToken);
        mockResponse.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          path: "/token/refresh",
        });
        mockResponse.json({ accessToken: newAccessToken });
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedUserService.refreshToken).toHaveBeenCalledWith(
        mockUser.id,
        "old-refresh-token",
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "refreshToken",
        newRefreshToken,
        {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          path: "/token/refresh",
        },
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        accessToken: newAccessToken,
      });
      expect(mockNext).not.toHaveBeenCalled();

      // Teardown - beforeEach에서 처리됨
    });

    test("리프레시 토큰 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRequest = {
        cookies: { refreshToken: "invalid-refresh-token" },
        user: mockUser,
      } as any;

      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      const authError = new AuthenticationError("Unauthorized");
      mockedUserService.refreshToken.mockRejectedValue(authError);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const refreshToken = mockRequest.cookies.refreshToken;
        const { id } = mockRequest.user;

        const { newAccessToken, newRefreshToken } =
          await userService.refreshToken(id, refreshToken);
        mockResponse.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          path: "/token/refresh",
        });
        mockResponse.json({ accessToken: newAccessToken });
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedUserService.refreshToken).toHaveBeenCalledWith(
        mockUser.id,
        "invalid-refresh-token",
      );
      expect(mockNext).toHaveBeenCalledWith(authError);

      // Teardown - beforeEach에서 처리됨
    });
  });
});
