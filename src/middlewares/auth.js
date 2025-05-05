import userRepository from "../repositories/userRepository.js";
import { expressjwt } from "express-jwt";
import reviewRepository from "../repositories/reviewRepository.js";

function throwUnauthorizedError() {
  // 인증되지 않은 경우 401 에러를 발생시키는 함수
  const error = new Error("Unauthorized");
  error.code = 401;
  throw error;
}

// TODO: passport 의 세션 기반 인증 방식으로 변경
async function verifySessionLogin(req, res, next) {
  if (!req.isAuthenticated()) {
    throwUnauthorizedError();
  }
  next();
}

const verifyAccessToken = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

const verifyRefreshToken = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
  getToken: (req) => req.cookies.refreshToken,
});

async function verifyReviewAuth(req, res, next) {
  const { id: reviewId } = req.params;
  try {
    const review = await reviewRepository.getById(reviewId);
    if (!review) {
      const error = new Error("Review not found");
      error.code = 404;
      throw error;
    }

    if (review.authorId !== req.auth.userId) {
      const error = new Error("Forbidden");
      error.code = 403;
      throw error;
    }
    // 인증 성공 시 다음 미들웨어로 이동
    next();
  } catch (error) {
    // 에러 발생 시 에러 핸들러로 전파
    return next(error);
  }
}

function validateEmailAndPassword(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = new Error("email, password 가 모두 필요합니다.");
    error.code = 422;
    throw error;
  }
}
export default {
  verifySessionLogin,
  verifyAccessToken,
  verifyReviewAuth,
  verifyRefreshToken,
  validateEmailAndPassword,
};
