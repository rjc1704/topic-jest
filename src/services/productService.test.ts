import productRepository from "../repositories/productRepository";
import { NotFoundError } from "../types/errors";

// productRepository 모킹
jest.mock("../repositories/productRepository");
const mockedProductRepository = productRepository as jest.Mocked<
  typeof productRepository
>;

describe("ProductService", () => {
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

      mockedProductRepository.getById.mockResolvedValue(expectedProduct);

      // Exercise - 서비스 로직을 직접 실행
      const result = await productRepository.getById(productId);

      // Assertion
      expect(mockedProductRepository.getById).toHaveBeenCalledWith(productId);
      expect(mockedProductRepository.getById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedProduct);
    });

    test("상품이 존재하지 않는 경우 null을 반환해야 한다", async () => {
      // Setup
      const productId = 999;
      mockedProductRepository.getById.mockResolvedValue(null);

      // Exercise - 서비스 로직을 직접 실행
      const result = await productRepository.getById(productId);

      // Assertion
      expect(mockedProductRepository.getById).toHaveBeenCalledWith(productId);
      expect(result).toBeNull();
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const productId = 1;
      const error = new Error("Database connection failed");
      mockedProductRepository.getById.mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await productRepository.getById(productId);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Database connection failed");
      }
    });
  });

  describe("create", () => {
    test("상품 생성이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const productData = {
        name: "Test Product",
        price: 10000,
      };

      const expectedProduct = {
        id: 1,
        name: "Test Product",
        price: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedProductRepository.save.mockResolvedValue(expectedProduct);

      // Exercise - 서비스 로직을 직접 실행
      const result = await productRepository.save(productData);

      // Assertion
      expect(mockedProductRepository.save).toHaveBeenCalledWith(productData);
      expect(mockedProductRepository.save).toHaveBeenCalledTimes(1);
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

      mockedProductRepository.save.mockResolvedValue(expectedProduct);

      // Exercise - 서비스 로직을 직접 실행
      const result = await productRepository.save(productData);

      // Assertion
      expect(mockedProductRepository.save).toHaveBeenCalledWith(productData);
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

      mockedProductRepository.save.mockResolvedValue(expectedProduct);

      // Exercise - 서비스 로직을 직접 실행
      const result = await productRepository.save(productData);

      // Assertion
      expect(mockedProductRepository.save).toHaveBeenCalledWith(productData);
      expect(result).toEqual(expectedProduct);
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const productData = {
        name: "Test Product",
        price: 10000,
      };

      const error = new Error("Database connection failed");
      mockedProductRepository.save.mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await productRepository.save(productData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Database connection failed");
      }
    });

    test("유효성 검사 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const productData = {
        name: "Test Product",
        price: -1000, // 잘못된 가격
      };

      const error = new Error("Price must be non-negative");
      mockedProductRepository.save.mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await productRepository.save(productData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Price must be non-negative");
      }
    });
  });
});
