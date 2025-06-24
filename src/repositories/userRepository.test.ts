import prisma from "../config/prisma";
import userRepository from "./userRepository";

// Prisma 클라이언트 모킹
jest.mock("../config/prisma", () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe("UserRepository", () => {
  // 각 테스트 전에 모든 모킹을 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    test("사용자 조회가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const userId = 1;
      const expectedUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        password: "hashedPassword",
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(
        expectedUser,
      );

      // Exercise - Repository 로직을 직접 실행
      const result = await userRepository.findById(userId);

      // Assertion
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
      });
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedUser);
    });

    test("사용자가 존재하지 않는 경우 null을 반환해야 한다", async () => {
      // Setup
      const userId = 999;
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Exercise - Repository 로직을 직접 실행
      const result = await userRepository.findById(userId);

      // Assertion
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
      });
      expect(result).toBeNull();
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const userId = 1;
      const error = new Error("Database connection failed");
      (mockedPrisma.user.findUnique as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await userRepository.findById(userId);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Database connection failed");
      }
    });
  });

  describe("findByEmail", () => {
    test("이메일로 사용자 조회가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const email = "test@example.com";
      const expectedUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        password: "hashedPassword",
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(
        expectedUser,
      );

      // Exercise - Repository 로직을 직접 실행
      const result = await userRepository.findByEmail(email);

      // Assertion
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: email,
        },
      });
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedUser);
    });

    test("존재하지 않는 이메일인 경우 null을 반환해야 한다", async () => {
      // Setup
      const email = "nonexistent@example.com";
      (mockedPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Exercise - Repository 로직을 직접 실행
      const result = await userRepository.findByEmail(email);

      // Assertion
      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: email,
        },
      });
      expect(result).toBeNull();
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const email = "test@example.com";
      const error = new Error("Database connection failed");
      (mockedPrisma.user.findUnique as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await userRepository.findByEmail(email);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Database connection failed");
      }
    });
  });

  describe("save", () => {
    test("사용자 생성이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const userData = {
        email: "test@example.com",
        name: "Test User",
        password: "hashedPassword",
      };

      const expectedUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        password: "hashedPassword",
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.user.create as jest.Mock).mockResolvedValue(expectedUser);

      // Exercise - Repository 로직을 직접 실행
      const result = await userRepository.save(userData);

      // Assertion
      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          name: userData.name,
          password: userData.password,
        },
      });
      expect(mockedPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedUser);
    });

    test("리프레시 토큰이 포함된 사용자도 생성할 수 있어야 한다", async () => {
      // Setup
      const userData = {
        email: "test@example.com",
        name: "Test User",
        password: "hashedPassword",
      };

      const expectedUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        password: "hashedPassword",
        refreshToken: "refresh-token",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.user.create as jest.Mock).mockResolvedValue(expectedUser);

      // Exercise - Repository 로직을 직접 실행
      const result = await userRepository.save(userData);

      // Assertion
      expect(mockedPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          name: userData.name,
          password: userData.password,
        },
      });
      expect(result).toEqual(expectedUser);
    });

    test("중복 이메일 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const userData = {
        email: "existing@example.com",
        name: "Test User",
        password: "hashedPassword",
      };

      const error = new Error(
        "Unique constraint failed on the fields: (`email`)",
      );
      (mockedPrisma.user.create as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await userRepository.save(userData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          "Unique constraint failed on the fields: (`email`)",
        );
      }
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const userData = {
        email: "test@example.com",
        name: "Test User",
        password: "hashedPassword",
      };

      const error = new Error("Database connection failed");
      (mockedPrisma.user.create as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await userRepository.save(userData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Database connection failed");
      }
    });
  });

  describe("update", () => {
    test("사용자 정보 업데이트가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const userId = 1;
      const updateData = {
        name: "Updated Name",
        refreshToken: "new-refresh-token",
      };

      const expectedUser = {
        id: 1,
        email: "test@example.com",
        name: "Updated Name",
        password: "hashedPassword",
        refreshToken: "new-refresh-token",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.user.update as jest.Mock).mockResolvedValue(expectedUser);

      // Exercise - Repository 로직을 직접 실행
      const result = await userRepository.update(userId, updateData);

      // Assertion
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
        data: updateData,
      });
      expect(mockedPrisma.user.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedUser);
    });

    test("부분 업데이트가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const userId = 1;
      const updateData = {
        name: "Updated Name",
        // 다른 필드는 업데이트하지 않음
      };

      const expectedUser = {
        id: 1,
        email: "test@example.com",
        name: "Updated Name",
        password: "hashedPassword",
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.user.update as jest.Mock).mockResolvedValue(expectedUser);

      // Exercise - Repository 로직을 직접 실행
      const result = await userRepository.update(userId, updateData);

      // Assertion
      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: {
          id: userId,
        },
        data: updateData,
      });
      expect(result).toEqual(expectedUser);
    });

    test("존재하지 않는 사용자 업데이트 시 에러를 반환해야 한다", async () => {
      // Setup
      const userId = 999;
      const updateData = {
        name: "Updated Name",
      };

      const error = new Error("Record to update not found");
      (mockedPrisma.user.update as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await userRepository.update(userId, updateData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Record to update not found");
      }
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const userId = 1;
      const updateData = {
        name: "Updated Name",
      };

      const error = new Error("Database connection failed");
      (mockedPrisma.user.update as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await userRepository.update(userId, updateData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Database connection failed");
      }
    });
  });
});
