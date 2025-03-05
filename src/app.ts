import path from "path";
import routers from "./routers.js";
import cookieParser from "cookie-parser";
import wsServer from "./config/socket.js";
import express, { type Request, type Response } from "express";

// middlewares
import ErrorMiddleware from "./middlewares/error.middleware.js";
import MorganMiddleware from "./middlewares/morgan.middleware.js";
import { getDirname } from "./utils/path.js";

const __dirname = getDirname(import.meta.url);

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

    // use ejs
    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));

    // routes
    app.get("/", (req: Request, res: Response) => {
        res.render("home", { title: "Node Backend" });
    });
    app.use("/api/v1", Object.values(routers));
    app.get('/api/ws/stats', (req, res) => {
        res.json({
            connections: wsServer.getClients(),
            status: 'healthy'
        });
    });

    app.post('/api/ws/broadcast', (req, res) => {
        wsServer.broadcast({
            type: 'announcement',
            message: req.body.message
        });
        res.json({ success: true });
    });

    // error middleware
    app.use(ErrorMiddleware);

    return app;
};
