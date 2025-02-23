import express from "express";
const router = express.Router();
import passport from "passport";
import * as authControllers from "../../controllers/auth.controller.js";
import rateLimit from "express-rate-limit";

const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
        const failedAttempts = req.cookies.failedAttempts || 0;
        return failedAttempts < 5 ? 5 : 10;
    },
    message: "Too many login attempts, please try again later.",
    keyGenerator: (req) => {
        return `${req.ip}_${req.body.email} || 'unknown'}`;
    },
    standardHeaders: true,
    legacyHeaders: true,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many login attempts, please try again later."
        });
    }
});

// define routes
router.route("/auth/login").post(loginRateLimiter, authControllers.loginUser);
router.route("/auth/logout").get(authControllers.logoutUser);
router.route("/auth/register").post(authControllers.registerUser);
router.route("/auth/refresh").get(authControllers.refreshAccessToken);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    authControllers.googleAuthCallback
);

// export router
export default router;
