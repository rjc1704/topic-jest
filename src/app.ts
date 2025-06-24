import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import userController from "./controllers/userController";
import productController from "./controllers/productController";
import reviewController from "./controllers/reviewController";
import errorHandler from "./middlewares/errorHandler";
import passport from "./config/passport";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default-session-secret",
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use("", userController);
app.use("/products", productController);
app.use("/reviews", reviewController);

app.use(errorHandler);

export default app;
