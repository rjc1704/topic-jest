import userRepository from "../repositories/userRepository.js";
import { expressjwt } from "express-jwt";
import reviewRepository from "../repositories/reviewRepository.js";

function throwUnauthorizedError() {
  // 인증되지 않은 경우 401 에러를 발생시키는 함수
  const error = new Error("Unauthorized");
  error.code = 401;
  throw error;
}

async function verifySessionLogin(req, res, next) {
  // 세션에서 사용자 정보를 읽어옴
  try {
    const { userId } = req.session;

    if (!userId) {
      // 로그인되어있지 않으면 인증 실패
      throwUnauthorizedError();
    }

    const user = await userRepository.findById(req.session.userId);

    if (!user) {
      throwUnauthorizedError();
    }

    // 이후 편리성을 위한 유저 정보 전달
    req.user = {
      id: req.session.userId,
      email: user.email,
      name: user.name,
      provider: user.provider,
      providerId: user.providerId,
    };
    // 사용자가 로그인되어 있다면 다음 미들웨어 처리
    next();
  } catch (error) {
    next(error);
  }
}

// TODO: verifyAccessToken 함수 추가
// Authorization Header 에 Bearer {token} 형식으로 요청왔을 때 토큰 검증 동작
const verifyAccessToken = expressjwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

// TODO: verifyReviewAuth 함수 추가

async function verifyReviewAuth(req, res, next) {
  // req.params에서 reviewId를 추출 (id 에 alias 로 reviewId 사용)
  const { id: reviewId } = req.params;
  try {
    // reviewRepository 에서 적절한 함수를 호출하여 reviewId 에 해당하는 리뷰를 조회
    // 1. 여기 코드 이어서 작성하세요
    const review = await reviewRepository.getById(reviewId);
    // 리뷰가 존재하지 않으면 404 에러 발생. error.code 를 404 로 설정
    // 적절한 에러 메시지 사용
    // 2. 여기 코드 이어서 작성하세요
    if (!review) {
      const error = new Error("Review not found");
      error.code = 404;
      throw error;
    }
    // 리뷰의 작성자와 요청자가 일치하지 않으면 403 에러 발생. error.code 를 403 로 설정
    // 적절한 에러 메시지 사용
    // 작성자 id 와 요청자 id 가 일치하는지 확인. schema.prisma 에서 작성자 id 컬럼 확인
    // 3. 여기 코드 이어서 작성하세요
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

export default {
  verifySessionLogin,
  verifyAccessToken,
  verifyReviewAuth,
};
