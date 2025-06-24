import { Request, Response, NextFunction } from "express";
import auth from "./auth";
import reviewRepository from "../repositories/reviewRepository";
import {
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../types/errors";

// reviewRepository 모킹
jest.mock("../repositories/reviewRepository");
const mockedReviewRepository = reviewRepository as jest.Mocked<
  typeof reviewRepository
>;

describe("Auth Middleware", () => {
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn() as jest.MockedFunction<NextFunction>;
  });

  describe("verifySessionLogin", () => {
    test("인증된 사용자는 다음 미들웨어로 진행되어야 한다", () => {
      // Setup
      mockRequest.isAuthenticated = jest.fn().mockReturnValue(true);

      // Exercise
      auth.verifySessionLogin(mockRequest, mockResponse as Response, mockNext);

      // Assertion
      expect(mockRequest.isAuthenticated).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith();
    });

    test("인증되지 않은 사용자는 AuthenticationError를 발생시켜야 한다", () => {
      // Setup
      mockRequest.isAuthenticated = jest.fn().mockReturnValue(false);

      // Exercise
      auth.verifySessionLogin(mockRequest, mockResponse as Response, mockNext);

      // Assertion
      expect(mockRequest.isAuthenticated).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
      const error = mockNext.mock.calls[0][0] as unknown as AuthenticationError;
      expect(error.message).toBe("Unauthorized");
    });
  });

  describe("verifyReviewAuth", () => {
    test("리뷰 작성자가 요청하면 다음 미들웨어로 진행되어야 한다", async () => {
      // Setup
      const userId = 1;
      const reviewId = 1;
      const review = {
        id: 1,
        title: "Test Review",
        description: "Test Description",
        rating: 5,
        productId: 1,
        authorId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: reviewId.toString() };
      mockRequest.user = { id: userId };
      mockedReviewRepository.getById.mockResolvedValue(review);

      // Exercise
      await auth.verifyReviewAuth(
        mockRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assertion
      expect(mockedReviewRepository.getById).toHaveBeenCalledWith(reviewId);
      expect(mockNext).toHaveBeenCalledWith();
    });

    test("리뷰가 존재하지 않으면 NotFoundError를 발생시켜야 한다", async () => {
      // Setup
      const reviewId = 999;
      mockRequest.params = { id: reviewId.toString() };
      mockedReviewRepository.getById.mockResolvedValue(null);

      // Exercise
      await auth.verifyReviewAuth(
        mockRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assertion
      expect(mockedReviewRepository.getById).toHaveBeenCalledWith(reviewId);
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
      const error = mockNext.mock.calls[0][0] as unknown as NotFoundError;
      expect(error.message).toBe("Review not found");
    });

    test("인증되지 않은 사용자는 AuthenticationError를 발생시켜야 한다", async () => {
      // Setup
      const reviewId = 1;
      const review = {
        id: 1,
        title: "Test Review",
        description: "Test Description",
        rating: 5,
        productId: 1,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: reviewId.toString() };
      mockRequest.user = undefined;
      mockRequest.auth = undefined;
      mockedReviewRepository.getById.mockResolvedValue(review);

      // Exercise
      await auth.verifyReviewAuth(
        mockRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assertion
      expect(mockedReviewRepository.getById).toHaveBeenCalledWith(reviewId);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
      const error = mockNext.mock.calls[0][0] as unknown as AuthenticationError;
      expect(error.message).toBe("User not authenticated");
    });

    test("다른 사용자의 리뷰에 접근하면 ForbiddenError를 발생시켜야 한다", async () => {
      // Setup
      const userId = 1;
      const reviewId = 1;
      const review = {
        id: 1,
        title: "Test Review",
        description: "Test Description",
        rating: 5,
        productId: 1,
        authorId: 2, // 다른 사용자
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: reviewId.toString() };
      mockRequest.user = { id: userId };
      mockedReviewRepository.getById.mockResolvedValue(review);

      // Exercise
      await auth.verifyReviewAuth(
        mockRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assertion
      expect(mockedReviewRepository.getById).toHaveBeenCalledWith(reviewId);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = mockNext.mock.calls[0][0] as unknown as ForbiddenError;
      expect(error.message).toBe("Forbidden");
    });

    test("expressJwt의 req.auth를 사용할 수 있어야 한다", async () => {
      // Setup
      const userId = 1;
      const reviewId = 1;
      const review = {
        id: 1,
        title: "Test Review",
        description: "Test Description",
        rating: 5,
        productId: 1,
        authorId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: reviewId.toString() };
      mockRequest.user = undefined;
      mockRequest.auth = { userId };
      mockedReviewRepository.getById.mockResolvedValue(review);

      // Exercise
      await auth.verifyReviewAuth(
        mockRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assertion
      expect(mockedReviewRepository.getById).toHaveBeenCalledWith(reviewId);
      expect(mockNext).toHaveBeenCalledWith();
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const reviewId = 1;
      const error = new Error("Database error");
      mockRequest.params = { id: reviewId.toString() };
      mockedReviewRepository.getById.mockRejectedValue(error);

      // Exercise
      await auth.verifyReviewAuth(
        mockRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assertion
      expect(mockedReviewRepository.getById).toHaveBeenCalledWith(reviewId);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("validateEmailAndPassword", () => {
    test("이메일과 비밀번호가 모두 있으면 다음 미들웨어로 진행되어야 한다", () => {
      // Setup
      const email = "test@example.com";
      const password = "password123";
      mockRequest.body = { email, password };

      // Exercise
      auth.validateEmailAndPassword(
        mockRequest,
        mockResponse as Response,
        mockNext,
      );

      // Assertion
      expect(mockNext).toHaveBeenCalledWith();
    });

    test("이메일이 없으면 ValidationError를 발생시켜야 한다", () => {
      // Setup
      const password = "password123";
      mockRequest.body = { password };

      // Exercise
      expect(() => {
        auth.validateEmailAndPassword(
          mockRequest,
          mockResponse as Response,
          mockNext,
        );
      }).toThrow(ValidationError);

      // Assertion
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("비밀번호가 없으면 ValidationError를 발생시켜야 한다", () => {
      // Setup
      const email = "test@example.com";
      mockRequest.body = { email };

      // Exercise
      expect(() => {
        auth.validateEmailAndPassword(
          mockRequest,
          mockResponse as Response,
          mockNext,
        );
      }).toThrow(ValidationError);

      // Assertion
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("이메일과 비밀번호가 모두 없으면 ValidationError를 발생시켜야 한다", () => {
      // Setup
      mockRequest.body = {};

      // Exercise
      expect(() => {
        auth.validateEmailAndPassword(
          mockRequest,
          mockResponse as Response,
          mockNext,
        );
      }).toThrow(ValidationError);

      // Assertion
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("빈 문자열인 경우도 ValidationError를 발생시켜야 한다", () => {
      // Setup
      const email = "";
      const password = "";
      mockRequest.body = { email, password };

      // Exercise
      expect(() => {
        auth.validateEmailAndPassword(
          mockRequest,
          mockResponse as Response,
          mockNext,
        );
      }).toThrow(ValidationError);

      // Assertion
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("공백만 있는 경우도 ValidationError를 발생시켜야 한다", () => {
      // Setup
      const email = "   ";
      const password = "   ";
      mockRequest.body = { email, password };

      // Exercise
      expect(() => {
        auth.validateEmailAndPassword(
          mockRequest,
          mockResponse as Response,
          mockNext,
        );
      }).toThrow(ValidationError);

      // Assertion
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("verifyAccessToken", () => {
    test("expressjwt 미들웨어가 올바르게 설정되어야 한다", () => {
      // Setup
      const originalEnv = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "test-secret";

      // Exercise & Assertion
      expect(auth.verifyAccessToken).toBeDefined();
      expect(typeof auth.verifyAccessToken).toBe("function");

      // Cleanup
      process.env.JWT_SECRET = originalEnv;
    });
  });

  describe("verifyRefreshToken", () => {
    test("expressjwt 미들웨어가 올바르게 설정되어야 한다", () => {
      // Setup
      const originalEnv = process.env.JWT_SECRET;
      process.env.JWT_SECRET = "test-secret";

      // Exercise & Assertion
      expect(auth.verifyRefreshToken).toBeDefined();
      expect(typeof auth.verifyRefreshToken).toBe("function");

      // Cleanup
      process.env.JWT_SECRET = originalEnv;
    });
  });
});
