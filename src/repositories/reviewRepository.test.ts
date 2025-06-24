import prisma from "../config/prisma";
import reviewRepository from "./reviewRepository";

// Prisma 클라이언트 모킹
jest.mock("../config/prisma", () => ({
  review: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe("ReviewRepository", () => {
  // 각 테스트 전에 모든 모킹을 초기화
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    test("리뷰 생성이 성공적으로 완료되어야 한다", async () => {
      // Setup
      const reviewData = {
        title: "Great Product!",
        description: "This product exceeded my expectations.",
        rating: 5,
        productId: 1,
        authorId: 1,
      };

      const expectedReview = {
        id: 1,
        title: "Great Product!",
        description: "This product exceeded my expectations.",
        rating: 5,
        productId: 1,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.review.create as jest.Mock).mockResolvedValue(
        expectedReview,
      );

      // Exercise
      const result = await reviewRepository.save(reviewData);

      // Assertion
      expect(mockedPrisma.review.create).toHaveBeenCalledWith({
        data: {
          title: reviewData.title,
          description: reviewData.description,
          rating: reviewData.rating,
          product: {
            connect: {
              id: reviewData.productId,
            },
          },
          author: {
            connect: {
              id: reviewData.authorId,
            },
          },
        },
      });
      expect(mockedPrisma.review.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedReview);
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const reviewData = {
        title: "Great Product!",
        description: "This product exceeded my expectations.",
        rating: 5,
        productId: 1,
        authorId: 1,
      };

      const error = new Error("Database connection failed");
      (mockedPrisma.review.create as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(reviewRepository.save(reviewData)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("getById", () => {
    test("리뷰 조회가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const reviewId = 1;
      const expectedReview = {
        id: 1,
        title: "Great Product!",
        description: "This product exceeded my expectations.",
        rating: 5,
        productId: 1,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.review.findUnique as jest.Mock).mockResolvedValue(
        expectedReview,
      );

      // Exercise
      const result = await reviewRepository.getById(reviewId);

      // Assertion
      expect(mockedPrisma.review.findUnique).toHaveBeenCalledWith({
        where: {
          id: reviewId,
        },
      });
      expect(mockedPrisma.review.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedReview);
    });

    test("리뷰가 존재하지 않는 경우 null을 반환해야 한다", async () => {
      // Setup
      const reviewId = 999;
      (mockedPrisma.review.findUnique as jest.Mock).mockResolvedValue(null);

      // Exercise
      const result = await reviewRepository.getById(reviewId);

      // Assertion
      expect(mockedPrisma.review.findUnique).toHaveBeenCalledWith({
        where: {
          id: reviewId,
        },
      });
      expect(result).toBeNull();
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const reviewId = 1;
      const error = new Error("Database connection failed");
      (mockedPrisma.review.findUnique as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(reviewRepository.getById(reviewId)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("getAll", () => {
    test("모든 리뷰 조회가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const expectedReviews = [
        {
          id: 1,
          title: "Great Product!",
          description: "This product exceeded my expectations.",
          rating: 5,
          productId: 1,
          authorId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: "Good Product",
          description: "This product is good but could be better.",
          rating: 4,
          productId: 1,
          authorId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockedPrisma.review.findMany as jest.Mock).mockResolvedValue(
        expectedReviews,
      );

      // Exercise
      const result = await reviewRepository.getAll();

      // Assertion
      expect(mockedPrisma.review.findMany).toHaveBeenCalledWith();
      expect(mockedPrisma.review.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedReviews);
    });

    test("리뷰가 없는 경우 빈 배열을 반환해야 한다", async () => {
      // Setup
      (mockedPrisma.review.findMany as jest.Mock).mockResolvedValue([]);

      // Exercise
      const result = await reviewRepository.getAll();

      // Assertion
      expect(mockedPrisma.review.findMany).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const error = new Error("Database connection failed");
      (mockedPrisma.review.findMany as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(reviewRepository.getAll()).rejects.toThrow(
        "Database connection failed",
      );
    });
  });

  describe("update", () => {
    test("리뷰 업데이트가 성공적으로 완료되어야 한다", async () => {
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

      (mockedPrisma.review.update as jest.Mock).mockResolvedValue(
        expectedReview,
      );

      // Exercise
      const result = await reviewRepository.update(reviewId, updateData);

      // Assertion
      expect(mockedPrisma.review.update).toHaveBeenCalledWith({
        where: {
          id: reviewId,
        },
        data: {
          title: updateData.title,
          description: updateData.description,
          rating: updateData.rating,
        },
      });
      expect(mockedPrisma.review.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedReview);
    });

    test("부분 업데이트가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const reviewId = 1;
      const updateData = {
        title: "Updated Title",
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

      (mockedPrisma.review.update as jest.Mock).mockResolvedValue(
        expectedReview,
      );

      // Exercise
      const result = await reviewRepository.update(reviewId, updateData);

      // Assertion
      expect(mockedPrisma.review.update).toHaveBeenCalledWith({
        where: {
          id: reviewId,
        },
        data: {
          title: updateData.title,
          description: undefined,
          rating: undefined,
        },
      });
      expect(result).toEqual(expectedReview);
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const reviewId = 1;
      const updateData = {
        title: "Updated Title",
        description: "Updated description",
        rating: 4,
      };

      const error = new Error("Database connection failed");
      (mockedPrisma.review.update as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(
        reviewRepository.update(reviewId, updateData),
      ).rejects.toThrow("Database connection failed");
    });
  });

  describe("deleteById", () => {
    test("리뷰 삭제가 성공적으로 완료되어야 한다", async () => {
      // Setup
      const reviewId = 1;
      const expectedReview = {
        id: 1,
        title: "Great Product!",
        description: "This product exceeded my expectations.",
        rating: 5,
        productId: 1,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockedPrisma.review.delete as jest.Mock).mockResolvedValue(
        expectedReview,
      );

      // Exercise
      const result = await reviewRepository.deleteById(reviewId);

      // Assertion
      expect(mockedPrisma.review.delete).toHaveBeenCalledWith({
        where: {
          id: reviewId,
        },
      });
      expect(mockedPrisma.review.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedReview);
    });

    test("데이터베이스 에러를 적절히 처리해야 한다", async () => {
      // Setup
      const reviewId = 1;
      const error = new Error("Database connection failed");
      (mockedPrisma.review.delete as jest.Mock).mockRejectedValue(error);

      // Exercise & Assertion
      await expect(reviewRepository.deleteById(reviewId)).rejects.toThrow(
        "Database connection failed",
      );
    });
  });
});
