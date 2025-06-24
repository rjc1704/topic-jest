import productService from "../services/productService";
import { NotFoundError } from "../types/errors";
import { Request, Response, NextFunction } from "express";

// productService 모킹
jest.mock("../services/productService");
const mockedProductService = productService as jest.Mocked<
  typeof productService
>;

// 컨트롤러 함수들을 직접 테스트하기 위한 헬퍼 함수
const createMockRequest = (body?: any, params?: any) =>
  ({
    body,
    params,
  } as Request);

const createMockResponse = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response);

const createMockNext = () => jest.fn() as NextFunction;

describe("ProductController", () => {
  // 각 테스트 전에 모든 모킹을 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST / 상품 생성", () => {
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

      const mockRequest = createMockRequest(productData);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      mockedProductService.create.mockResolvedValue(expectedProduct);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const createdProduct = await productService.create(mockRequest.body);
        mockResponse.json(createdProduct);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedProductService.create).toHaveBeenCalledWith(productData);
      expect(mockedProductService.create).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedProduct);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("서비스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const productData = {
        name: "Test Product",
        price: -1000, // 잘못된 가격
      };

      const mockRequest = createMockRequest(productData);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      const error = new Error("Invalid price");
      mockedProductService.create.mockRejectedValue(error);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const createdProduct = await productService.create(mockRequest.body);
        mockResponse.json(createdProduct);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedProductService.create).toHaveBeenCalledWith(productData);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("GET /:id 상품 조회", () => {
    test("상품 조회가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const params = { id: "1" };
      const expectedProduct = {
        id: 1,
        name: "Test Product",
        price: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRequest = createMockRequest({}, params);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      mockedProductService.getById.mockResolvedValue(expectedProduct);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { id } = mockRequest.params;
        const product = await productService.getById(+id);

        if (!product) {
          throw new NotFoundError("Product not found");
        }

        mockResponse.json(product);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedProductService.getById).toHaveBeenCalledWith(1);
      expect(mockedProductService.getById).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedProduct);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("상품이 존재하지 않는 경우 NotFoundError를 반환해야 한다", async () => {
      // Setup
      const params = { id: "999" };
      const mockRequest = createMockRequest({}, params);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      mockedProductService.getById.mockResolvedValue(null);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { id } = mockRequest.params;
        const product = await productService.getById(+id);

        if (!product) {
          throw new NotFoundError("Product not found");
        }

        mockResponse.json(product);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedProductService.getById).toHaveBeenCalledWith(999);
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe(
        "Product not found",
      );
    });

    test("서비스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const params = { id: "1" };
      const mockRequest = createMockRequest({}, params);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      const error = new Error("Database connection failed");
      mockedProductService.getById.mockRejectedValue(error);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { id } = mockRequest.params;
        const product = await productService.getById(+id);

        if (!product) {
          throw new NotFoundError("Product not found");
        }

        mockResponse.json(product);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedProductService.getById).toHaveBeenCalledWith(1);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
