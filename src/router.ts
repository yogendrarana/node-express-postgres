import { Router } from "express";
import wsRouter from "./routes/ws.routes.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import adminRouter from "./routes/admin.routes.js";

const router: Router = Router();

// v1 routes
const v1Routes: Router = Router();
v1Routes.use("/ws", wsRouter);
v1Routes.use("/auth", authRouter);
v1Routes.use("/user", userRouter);
v1Routes.use("/admin", adminRouter);

// attach v1 routes
router.use("/api/v1", v1Routes);

export default router;
