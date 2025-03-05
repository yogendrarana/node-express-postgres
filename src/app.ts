import path from "path";
import router from "./router.js";
import cookieParser from "cookie-parser";
import express, { type Request, type Response } from "express";

// middlewares
import { getDirname } from "./utils/path.js";
import ErrorMiddleware from "./middlewares/error.middleware.js";
import MorganMiddleware from "./middlewares/morgan.middleware.js";

const __dirname = getDirname(import.meta.url);

// Create Express app instance
const app = express();

// set view engine
app.set("views", "views");
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "./public")));

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(MorganMiddleware);
app.use(express.urlencoded({ extended: true }));

// use ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// routes
app.get("/", (_req: Request, res: Response) => {
    res.render("home", { title: "Node Backend" });
});

// api routes
app.use(router);

// error middleware
app.use(ErrorMiddleware);

// export the express app
export default app;
