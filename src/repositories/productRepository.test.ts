import prisma from "../config/prisma";
import productRepository from "./productRepository";

// Prisma 클라이언트 모킹
jest.mock("../config/prisma", () => ({
  product: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe("ProductRepository", () => {
  // 각 테스트 전에 모든 모킹을 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getById", () => {
    test("상품 조회가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const productId = 1;
      const expectedProduct = {
        id: 1,
        name: "Test Product",
        price: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.product.findUnique as jest.Mock).mockResolvedValue(
        expectedProduct,
      );

      // Exercise
      const result = await productRepository.getById(productId);

      // Assertion
      expect(mockedPrisma.product.findUnique).toHaveBeenCalledWith({
        where: {
          id: productId,
        },
      });
      expect(mockedPrisma.product.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedProduct);
    });

    test("상품이 존재하지 않는 경우 null을 반환해야 한다", async () => {
      // Setup
      const productId = 999;
      (mockedPrisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      // Exercise
      const result = await productRepository.getById(productId);

      // Assertion
      expect(mockedPrisma.product.findUnique).toHaveBeenCalledWith({
        where: {
          id: productId,
        },
      });
      expect(result).toBeNull();
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const productId = 1;
      const error = new Error("Database connection failed");
      (mockedPrisma.product.findUnique as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(productRepository.getById(productId)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("save", () => {
    test("상품 생성이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const productData = {
        name: "New Product",
        price: 15000,
      };

      const expectedProduct = {
        id: 1,
        name: "New Product",
        price: 15000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.product.create as jest.Mock).mockResolvedValue(
        expectedProduct,
      );

      // Exercise
      const result = await productRepository.save(productData);

      // Assertion
      expect(mockedPrisma.product.create).toHaveBeenCalledWith({
        data: {
          name: productData.name,
          price: productData.price,
        },
      });
      expect(mockedPrisma.product.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedProduct);
    });

    test("가격이 0인 상품도 생성할 수 있어야 한다", async () => {
      // Setup
      const productData = {
        name: "Free Product",
        price: 0,
      };

      const expectedProduct = {
        id: 1,
        name: "Free Product",
        price: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.product.create as jest.Mock).mockResolvedValue(
        expectedProduct,
      );

      // Exercise
      const result = await productRepository.save(productData);

      // Assertion
      expect(mockedPrisma.product.create).toHaveBeenCalledWith({
        data: {
          name: productData.name,
          price: productData.price,
        },
      });
      expect(result).toEqual(expectedProduct);
    });

    test("고가의 상품도 생성할 수 있어야 한다", async () => {
      // Setup
      const productData = {
        name: "Expensive Product",
        price: 1000000,
      };

      const expectedProduct = {
        id: 1,
        name: "Expensive Product",
        price: 1000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.product.create as jest.Mock).mockResolvedValue(
        expectedProduct,
      );

      // Exercise
      const result = await productRepository.save(productData);

      // Assertion
      expect(mockedPrisma.product.create).toHaveBeenCalledWith({
        data: {
          name: productData.name,
          price: productData.price,
        },
      });
      expect(result).toEqual(expectedProduct);
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const productData = {
        name: "Test Product",
        price: 10000,
      };

      const error = new Error("Database connection failed");
      (mockedPrisma.product.create as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(productRepository.save(productData)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });
});
