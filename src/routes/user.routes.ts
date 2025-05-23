import express from "express"
const router = express.Router();

// import controllers and middlewares
import * as userControllers from "../controllers/user.controller.js";

// define routes
router.route('/').get(userControllers.getUsers);

// export router
export default router;