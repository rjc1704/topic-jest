import { Strategy as LocalStrategy } from "passport-local";
import userService from "../../services/userService";

export async function localVerify(email: string, password: string, done: any) {
  try {
    const user = await userService.getUser(email, password);
    if (!user) {
      return done(null, false); // req.isAuthenticated() = false
    }
    return done(null, user); // req.user = user; req.isAuthenticated() = true
  } catch (error) {
    return done(error); // DB 오류 발생시 에러 반환
  }
}

const localStrategy = new LocalStrategy(
  {
    usernameField: "email",
  },
  localVerify,
);

export default localStrategy;
