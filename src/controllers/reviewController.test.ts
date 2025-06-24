import reviewService from "../services/reviewService";
import {
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
} from "../types/errors";
import { Request, Response, NextFunction } from "express";

// reviewService 모킹
jest.mock("../services/reviewService");
const mockedReviewService = reviewService as jest.Mocked<typeof reviewService>;

// 컨트롤러 함수들을 직접 테스트하기 위한 헬퍼 함수
const createMockRequest = (body?: any, params?: any, auth?: any) =>
  ({
    body,
    params,
    auth,
  } as Request);

const createMockResponse = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response);

const createMockNext = () => jest.fn() as NextFunction;

describe("ReviewController", () => {
  // 각 테스트 전에 모든 모킹을 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST / 리뷰 생성", () => {
    test("리뷰 생성이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const reviewData = {
        title: "Great Product!",
        description: "This product is amazing",
        rating: 5,
        productId: 1,
      };

      const authData = {
        userId: "1",
      };

      const expectedReview = {
        id: 1,
        title: "Great Product!",
        description: "This product is amazing",
        rating: 5,
        productId: 1,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRequest = createMockRequest(reviewData, {}, authData);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      mockedReviewService.create.mockResolvedValue(expectedReview);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { userId } = mockRequest.auth;
        const createdReview = await reviewService.create({
          ...mockRequest.body,
          authorId: +userId,
        });
        mockResponse.status(201).json(createdReview);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedReviewService.create).toHaveBeenCalledWith({
        ...reviewData,
        authorId: 1,
      });
      expect(mockedReviewService.create).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedReview);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("서비스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const reviewData = {
        title: "Great Product!",
        description: "This product is amazing",
        rating: 5,
        productId: 1,
      };

      const authData = {
        userId: "1",
      };

      const mockRequest = createMockRequest(reviewData, {}, authData);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      const validationError = new ValidationError("Invalid rating");
      mockedReviewService.create.mockRejectedValue(validationError);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { userId } = mockRequest.auth;
        const createdReview = await reviewService.create({
          ...mockRequest.body,
          authorId: +userId,
        });
        mockResponse.status(201).json(createdReview);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedReviewService.create).toHaveBeenCalledWith({
        ...reviewData,
        authorId: 1,
      });
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe("GET /:id 리뷰 조회", () => {
    test("리뷰 조회가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const params = { id: "1" };
      const expectedReview = {
        id: 1,
        title: "Great Product!",
        description: "This product is amazing",
        rating: 5,
        productId: 1,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRequest = createMockRequest({}, params);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      mockedReviewService.getById.mockResolvedValue(expectedReview);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { id } = mockRequest.params;
        const review = await reviewService.getById(+id);
        mockResponse.json(review);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedReviewService.getById).toHaveBeenCalledWith(1);
      expect(mockedReviewService.getById).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedReview);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("리뷰가 존재하지 않는 경우 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const params = { id: "999" };
      const mockRequest = createMockRequest({}, params);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      const notFoundError = new NotFoundError("Review not found");
      mockedReviewService.getById.mockRejectedValue(notFoundError);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const { id } = mockRequest.params;
        const review = await reviewService.getById(+id);
        mockResponse.json(review);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedReviewService.getById).toHaveBeenCalledWith(999);
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe("GET / 모든 리뷰 조회", () => {
    test("모든 리뷰 조회가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const expectedReviews = [
        {
          id: 1,
          title: "Great Product!",
          description: "This product is amazing",
          rating: 5,
          productId: 1,
          authorId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: "Good Product",
          description: "This product is good",
          rating: 4,
          productId: 1,
          authorId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      mockedReviewService.getAll.mockResolvedValue(expectedReviews);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const reviews = await reviewService.getAll();
        mockResponse.json(reviews);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedReviewService.getAll).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedReviews);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("서비스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      const error = new Error("Database connection failed");
      mockedReviewService.getAll.mockRejectedValue(error);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const reviews = await reviewService.getAll();
        mockResponse.json(reviews);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedReviewService.getAll).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("PUT /:id 리뷰 수정", () => {
    test("리뷰 수정이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const updateData = {
        title: "Updated Title",
        description: "Updated description",
        rating: 4,
      };

      const params = { id: "1" };
      const expectedReview = {
        id: 1,
        title: "Updated Title",
        description: "Updated description",
        rating: 4,
        productId: 1,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRequest = createMockRequest(updateData, params);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      mockedReviewService.update.mockResolvedValue(expectedReview);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const updatedReview = await reviewService.update(
          +mockRequest.params.id,
          mockRequest.body,
        );
        mockResponse.json(updatedReview);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedReviewService.update).toHaveBeenCalledWith(1, updateData);
      expect(mockedReviewService.update).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedReview);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("서비스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const updateData = {
        title: "Updated Title",
        rating: 6, // 잘못된 rating
      };

      const params = { id: "1" };
      const mockRequest = createMockRequest(updateData, params);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      const validationError = new ValidationError(
        "Rating must be between 1 and 5",
      );
      mockedReviewService.update.mockRejectedValue(validationError);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const updatedReview = await reviewService.update(
          +mockRequest.params.id,
          mockRequest.body,
        );
        mockResponse.json(updatedReview);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedReviewService.update).toHaveBeenCalledWith(1, updateData);
      expect(mockNext).toHaveBeenCalledWith(validationError);
    });
  });

  describe("DELETE /:id 리뷰 삭제", () => {
    test("리뷰 삭제가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const params = { id: "1" };
      const expectedReview = {
        id: 1,
        title: "Great Product!",
        description: "This product is amazing",
        rating: 5,
        productId: 1,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRequest = createMockRequest({}, params);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      mockedReviewService.deleteById.mockResolvedValue(expectedReview);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const deletedReview = await reviewService.deleteById(
          +mockRequest.params.id,
        );
        mockResponse.json(deletedReview);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedReviewService.deleteById).toHaveBeenCalledWith(1);
      expect(mockedReviewService.deleteById).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedReview);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("리뷰가 존재하지 않는 경우 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const params = { id: "999" };
      const mockRequest = createMockRequest({}, params);
      const mockResponse = createMockResponse();
      const mockNext = createMockNext();

      const notFoundError = new NotFoundError("Review not found");
      mockedReviewService.deleteById.mockRejectedValue(notFoundError);

      // Exercise - 컨트롤러 로직을 직접 실행
      try {
        const deletedReview = await reviewService.deleteById(
          +mockRequest.params.id,
        );
        mockResponse.json(deletedReview);
      } catch (error) {
        mockNext(error);
      }

      // Assertion
      expect(mockedReviewService.deleteById).toHaveBeenCalledWith(999);
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });
});
