import express from "express";

import reviewService from "../services/reviewService.js";

const reviewController = express.Router();

// TODO: 인증된 사용자만 리뷰 생성 가능하도록 수정
reviewController.post("/", async (req, res, next) => {
  const { userId } = req.user;
  try {
    const createdReview = await reviewService.create({
      ...req.body,
      authorId: userId,
    });
    return res.status(201).json(createdReview);
  } catch (error) {
    return next(error);
  }
});

reviewController.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const review = await reviewService.getById(id);
    return res.json(review);
  } catch (error) {
    return next(error);
  }
});

reviewController.get("/", async (req, res, next) => {
  try {
    const reviews = await reviewService.getAll();
    return res.json(reviews);
  } catch (error) {
    return next(error);
  }
});

// TODO: 인증된 사용자만 리뷰 수정 가능하도록 수정
// TODO: 리뷰 작성자만 수정 가능하도록 수정
reviewController.put("/:id", async (req, res, next) => {
  try {
    const updatedReview = await reviewService.update(req.params.id, req.body);
    return res.json(updatedReview);
  } catch (error) {
    return next(error);
  }
});

// TODO: 인증된 사용자만 리뷰 삭제 가능하도록 수정
// TODO: 리뷰 작성자만 삭제 가능하도록 수정
reviewController.delete("/:id", async (req, res, next) => {
  try {
    const deletedReview = await reviewService.deleteById(req.params.id);
    return res.json(deletedReview);
  } catch (error) {
    return next(error);
  }
});

export default reviewController;
