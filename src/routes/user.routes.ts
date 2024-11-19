import express from "express"
const router = express.Router();

// import controllers and middlewares
import * as userControllers from "../controllers/user.controllers.js";

// define routes
router.route('/users').get(userControllers.getUsers);

// export router
export default router;