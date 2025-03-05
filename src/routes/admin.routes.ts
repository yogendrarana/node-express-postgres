import express from "express";
const router = express.Router();

// import controllers and middlewares
import * as roleMiddleware from "../middlewares/role.middlware.js";
import * as authMiddleware from "../middlewares/auth.middleware.js";
import * as adminController from "../controllers/admin.controller.js";

// define routes
router
    .route("/dashboard")
    .get(
        authMiddleware.verifyAccessToken,
        roleMiddleware.verifyAdminRole,
        adminController.getDashboardData
    );

// export
export default router;
