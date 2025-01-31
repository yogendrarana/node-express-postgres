import path from "path";
import express from "express";
import routers from "./routers.js";
import cookieParser from "cookie-parser";
import { __dirname } from "./util/path.js";

// middlewares
import ErrorMiddleware from "./middlewares/error.middlewares.js";
import MorganMiddleware from "./middlewares/morgan.middlewares.js";

export const createExpressApp = () => {
    const app = express();

    // set view engine
    app.set("view engine", "ejs");
    app.set("views", "views");
    app.use(express.static(path.join(__dirname, "./public")));

    // middleware
    app.use(express.json());
    app.use(cookieParser());
    app.use(MorganMiddleware);
    app.use(express.urlencoded({ extended: true }));

    // routes
    app.get("/", (_, res) => res.send("Welcome to Node JS!"));
    app.use("/api/v1", Object.values(routers));

    // error middleware
    app.use(ErrorMiddleware);

    return app;
};
