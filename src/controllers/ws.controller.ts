import wsServer from "../config/socket.js";
import type { Request, Response } from "express";

export const getStats = (_req: Request, res: Response) => {
    res.json({
        connections: wsServer.getClients(),
        status: "healthy"
    });
};

export const broadcastMessage = (req: Request, res: Response) => {
    wsServer.broadcast({
        type: "announcement",
        message: req.body.message
    });
    res.json({ success: true });
}; 