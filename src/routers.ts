import authRouter from "./routes/v1/auth.routes.js";
import userRouter from "./routes/v1/user.routes.js";
import adminRouter from "./routes/v1/admin.routes.js";

const routers = {
    authRouter,
    adminRouter,
    userRouter
}

export default routers;