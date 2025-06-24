import localStrategy, { localVerify } from "./localStrategy";
import userService from "../../services/userService";

// userService 모킹
jest.mock("../../services/userService");
const mockedUserService = userService as jest.Mocked<typeof userService>;

describe("Local Strategy", () => {
  let mockDone: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDone = jest.fn();
  });

  describe("인증 로직", () => {
    test("유효한 이메일과 비밀번호로 사용자를 찾으면 사용자를 반환해야 한다", async () => {
      // Setup
      const email = "test@example.com";
      const password = "password123";
      const user = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedUserService.getUser.mockResolvedValue(user);

      // Exercise
      await localVerify(email, password, mockDone);

      // Assertion
      expect(mockedUserService.getUser).toHaveBeenCalledWith(email, password);
      expect(mockDone).toHaveBeenCalledWith(null, user);
    });

    test("사용자가 존재하지 않으면 false를 반환해야 한다", async () => {
      // Setup
      const email = "nonexistent@example.com";
      const password = "wrongpassword";

      mockedUserService.getUser.mockResolvedValue(null as any);

      // Exercise
      await localVerify(email, password, mockDone);

      // Assertion
      expect(mockedUserService.getUser).toHaveBeenCalledWith(email, password);
      expect(mockDone).toHaveBeenCalledWith(null, false);
    });

    test("잘못된 비밀번호로 인증 실패 시 false를 반환해야 한다", async () => {
      // Setup
      const email = "test@example.com";
      const password = "wrongpassword";

      mockedUserService.getUser.mockResolvedValue(null as any);

      // Exercise
      await localVerify(email, password, mockDone);

      // Assertion
      expect(mockedUserService.getUser).toHaveBeenCalledWith(email, password);
      expect(mockDone).toHaveBeenCalledWith(null, false);
    });

    test("서비스 에러가 발생하면 에러를 전달해야 한다", async () => {
      // Setup
      const email = "test@example.com";
      const password = "password123";
      const error = new Error("Database connection failed");

      mockedUserService.getUser.mockRejectedValue(error);

      // Exercise
      await localVerify(email, password, mockDone);

      // Assertion
      expect(mockedUserService.getUser).toHaveBeenCalledWith(email, password);
      expect(mockDone).toHaveBeenCalledWith(error);
    });

    test("빈 이메일이나 비밀번호에 대해 적절히 처리해야 한다", async () => {
      // Setup
      const email = "";
      const password = "password123";

      mockedUserService.getUser.mockResolvedValue(null as any);

      // Exercise
      await localVerify(email, password, mockDone);

      // Assertion
      expect(mockedUserService.getUser).toHaveBeenCalledWith(email, password);
      expect(mockDone).toHaveBeenCalledWith(null, false);
    });

    test("null 이메일이나 비밀번호에 대해 적절히 처리해야 한다", async () => {
      // Setup
      const email = null as any;
      const password = null as any;

      mockedUserService.getUser.mockResolvedValue(null as any);

      // Exercise
      await localVerify(email, password, mockDone);

      // Assertion
      expect(mockedUserService.getUser).toHaveBeenCalledWith(email, password);
      expect(mockDone).toHaveBeenCalledWith(null, false);
    });
  });

  describe("Strategy Configuration", () => {
    test("localStrategy가 올바르게 구성되어야 한다", () => {
      // Assertion
      expect(localStrategy).toBeDefined();
      expect(localStrategy.name).toBe("local");
    });
  });
});
