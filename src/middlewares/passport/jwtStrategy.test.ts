import jwtStrategy, { cookieExtractor, jwtVerify } from "./jwtStrategy";
import userService from "../../services/userService";
import { Request } from "express";

// userService 모킹
jest.mock("../../services/userService");
const mockedUserService = userService as jest.Mocked<typeof userService>;

describe("JWT Strategy", () => {
  let mockRequest: Partial<Request>;
  let mockDone: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockDone = jest.fn();
  });

  describe("cookieExtractor", () => {
    test("쿠키에서 refreshToken을 추출해야 한다", () => {
      // Setup
      const refreshToken = "test-refresh-token";
      mockRequest.cookies = { refreshToken };

      // Exercise
      const token = cookieExtractor(mockRequest as Request);

      // Assertion
      expect(token).toBe(refreshToken);
    });

    test("쿠키가 없으면 undefined를 반환해야 한다", () => {
      // Setup
      mockRequest.cookies = {};

      // Exercise
      const token = cookieExtractor(mockRequest as Request);

      // Assertion
      expect(token).toBeUndefined();
    });

    test("request가 없으면 null을 반환해야 한다", () => {
      // Exercise
      const token = cookieExtractor(null as any);

      // Assertion
      expect(token).toBeNull();
    });
  });

  describe("jwtVerify", () => {
    test("유효한 사용자 ID로 사용자를 찾으면 사용자를 반환해야 한다", async () => {
      // Setup
      const userId = "1";
      const user = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const payload = { userId };

      mockedUserService.getUserById.mockResolvedValue(user);

      // Exercise
      await jwtVerify(payload, mockDone);

      // Assertion
      expect(mockedUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockDone).toHaveBeenCalledWith(null, user);
    });

    test("사용자가 존재하지 않으면 false를 반환해야 한다", async () => {
      // Setup
      const userId = "999";
      const payload = { userId };

      mockedUserService.getUserById.mockResolvedValue(null as any);

      // Exercise
      await jwtVerify(payload, mockDone);

      // Assertion
      expect(mockedUserService.getUserById).toHaveBeenCalledWith(999);
      expect(mockDone).toHaveBeenCalledWith(null, false);
    });

    test("서비스 에러가 발생하면 에러를 전달해야 한다", async () => {
      // Setup
      const userId = "1";
      const payload = { userId };
      const error = new Error("Database error");

      mockedUserService.getUserById.mockRejectedValue(error);

      // Exercise
      await jwtVerify(payload, mockDone);

      // Assertion
      expect(mockedUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockDone).toHaveBeenCalledWith(error);
    });

    test("잘못된 userId 형식에 대해 적절히 처리해야 한다", async () => {
      // Setup
      const userId = "invalid";
      const payload = { userId };

      mockedUserService.getUserById.mockResolvedValue(null as any);

      // Exercise
      await jwtVerify(payload, mockDone);

      // Assertion
      expect(mockedUserService.getUserById).toHaveBeenCalledWith(NaN);
      expect(mockDone).toHaveBeenCalledWith(null, false);
    });
  });

  describe("Strategy Configuration", () => {
    test("accessTokenStrategy가 올바르게 구성되어야 한다", () => {
      // Assertion
      expect(jwtStrategy.accessTokenStrategy).toBeDefined();
      expect(jwtStrategy.accessTokenStrategy.name).toBe("jwt");
    });

    test("refreshTokenStrategy가 올바르게 구성되어야 한다", () => {
      // Assertion
      expect(jwtStrategy.refreshTokenStrategy).toBeDefined();
      expect(jwtStrategy.refreshTokenStrategy.name).toBe("jwt");
    });
  });
});
