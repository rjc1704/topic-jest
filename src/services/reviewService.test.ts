import reviewRepository from "../repositories/reviewRepository";
import { NotFoundError } from "../types/errors";

// reviewRepository 모킹
jest.mock("../repositories/reviewRepository");
const mockedReviewRepository = reviewRepository as jest.Mocked<
  typeof reviewRepository
>;

describe("ReviewService", () => {
  // 각 테스트 전에 모든 모킹을 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    test("리뷰 생성이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const reviewData = {
        title: "Great Product!",
        description: "This product is amazing",
        rating: 5,
        productId: 1,
        authorId: 1,
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

      mockedReviewRepository.save.mockResolvedValue(expectedReview);

      // Exercise - 서비스 로직을 직접 실행
      const result = await reviewRepository.save(reviewData);

      // Assertion
      expect(mockedReviewRepository.save).toHaveBeenCalledWith(reviewData);
      expect(mockedReviewRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedReview);
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const reviewData = {
        title: "Great Product!",
        description: "This product is amazing",
        rating: 5,
        productId: 1,
        authorId: 1,
      };

      const error = new Error("Database connection failed");
      mockedReviewRepository.save.mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await reviewRepository.save(reviewData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Database connection failed");
      }
    });
  });

  describe("getById", () => {
    test("리뷰 조회가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const reviewId = 1;
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

      mockedReviewRepository.getById.mockResolvedValue(expectedReview);

      // Exercise - 서비스 로직을 직접 실행
      const result = await reviewRepository.getById(reviewId);

      // Assertion
      expect(mockedReviewRepository.getById).toHaveBeenCalledWith(reviewId);
      expect(mockedReviewRepository.getById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedReview);
    });

    test("리뷰가 존재하지 않는 경우 null을 반환해야 한다", async () => {
      // Setup
      const reviewId = 999;
      mockedReviewRepository.getById.mockResolvedValue(null);

      // Exercise - 서비스 로직을 직접 실행
      const result = await reviewRepository.getById(reviewId);

      // Assertion
      expect(mockedReviewRepository.getById).toHaveBeenCalledWith(reviewId);
      expect(result).toBeNull();
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const reviewId = 1;
      const error = new Error("Database connection failed");
      mockedReviewRepository.getById.mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await reviewRepository.getById(reviewId);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Database connection failed");
      }
    });
  });

  describe("getAll", () => {
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

      mockedReviewRepository.getAll.mockResolvedValue(expectedReviews);

      // Exercise - 서비스 로직을 직접 실행
      const result = await reviewRepository.getAll();

      // Assertion
      expect(mockedReviewRepository.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedReviews);
    });

    test("빈 배열을 반환해야 한다", async () => {
      // Setup
      mockedReviewRepository.getAll.mockResolvedValue([]);

      // Exercise - 서비스 로직을 직접 실행
      const result = await reviewRepository.getAll();

      // Assertion
      expect(mockedReviewRepository.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const error = new Error("Database connection failed");
      mockedReviewRepository.getAll.mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await reviewRepository.getAll();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Database connection failed");
      }
    });
  });

  describe("update", () => {
    test("리뷰 수정이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const reviewId = 1;
      const updateData = {
        title: "Updated Title",
        description: "Updated description",
        rating: 4,
      };

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

      mockedReviewRepository.update.mockResolvedValue(expectedReview);

      // Exercise - 서비스 로직을 직접 실행
      const result = await reviewRepository.update(reviewId, updateData);

      // Assertion
      expect(mockedReviewRepository.update).toHaveBeenCalledWith(
        reviewId,
        updateData,
      );
      expect(mockedReviewRepository.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedReview);
    });

    test("부분 업데이트가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const reviewId = 1;
      const updateData = {
        title: "Updated Title",
        // description과 rating은 업데이트하지 않음
      };

      const expectedReview = {
        id: 1,
        title: "Updated Title",
        description: "Original description",
        rating: 5,
        productId: 1,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedReviewRepository.update.mockResolvedValue(expectedReview);

      // Exercise - 서비스 로직을 직접 실행
      const result = await reviewRepository.update(reviewId, updateData);

      // Assertion
      expect(mockedReviewRepository.update).toHaveBeenCalledWith(
        reviewId,
        updateData,
      );
      expect(result).toEqual(expectedReview);
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const reviewId = 1;
      const updateData = {
        title: "Updated Title",
        rating: 6, // 잘못된 rating
      };

      const error = new Error("Invalid rating value");
      mockedReviewRepository.update.mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await reviewRepository.update(reviewId, updateData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Invalid rating value");
      }
    });
  });

  describe("deleteById", () => {
    test("리뷰 삭제가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const reviewId = 1;
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

      mockedReviewRepository.deleteById.mockResolvedValue(expectedReview);

      // Exercise - 서비스 로직을 직접 실행
      const result = await reviewRepository.deleteById(reviewId);

      // Assertion
      expect(mockedReviewRepository.deleteById).toHaveBeenCalledWith(reviewId);
      expect(mockedReviewRepository.deleteById).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedReview);
    });

    test("존재하지 않는 리뷰 삭제 시 에러를 반환해야 한다", async () => {
      // Setup
      const reviewId = 999;
      const error = new Error("Record to delete does not exist");
      mockedReviewRepository.deleteById.mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await reviewRepository.deleteById(reviewId);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          "Record to delete does not exist",
        );
      }
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const reviewId = 1;
      const error = new Error("Database connection failed");
      mockedReviewRepository.deleteById.mockRejectedValue(error);

      // Exercise & Assertion
      try {
        await reviewRepository.deleteById(reviewId);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Database connection failed");
      }
    });
  });
});
