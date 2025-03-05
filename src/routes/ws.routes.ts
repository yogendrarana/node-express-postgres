import { Router } from "express";
import * as wsControllers from "../controllers/ws.controller.js";

const router = Router();

router.get("/stats", wsControllers.getStats);
router.post("/broadcast", wsControllers.broadcastMessage);

export default router; 