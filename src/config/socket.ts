import { Server } from "http";
import { IncomingMessage } from "http";
import logger from './logger/logger.js';
import { WebSocket, WebSocketServer } from "ws";

type MessageHandler = (ws: WebSocket, message: string) => void;
type ConnectionHandler = (ws: WebSocket, request: IncomingMessage) => void;
type ErrorHandler = (ws: WebSocket, err: Error) => void;

interface WebSocketServerConfig {
    port?: number;
    path?: string;
    maxPayload?: number;
    pingInterval?: number;
    pingTimeout?: number;
    authHandler?: (request: IncomingMessage) => Promise<boolean> | boolean;
    rateLimit?: {
        messages: number;
        timeWindow: number; // in milliseconds
    };
}

interface WebSocketMessage {
    type: string;
    payload: unknown;
}

interface ServerMessage {
    type: 'connection' | 'response' | 'error';
    message?: string;
    data?: unknown;
    timestamp?: string;
}

const createWebSocketServer = (config: WebSocketServerConfig) => {
    let wss: WebSocketServer;

    // Store active connections
    const clients = new Set<WebSocket>();

    const handleConnection: ConnectionHandler = async (ws, request) => {
        try {
            // Check authentication if handler provided
            if (config.authHandler && !(await config.authHandler(request))) {
                ws.close(1008, 'Authentication failed');
                return;
            }
            
            clients.add(ws);
            logger.info(`New client connected. Total clients: ${clients.size}`);
            logger.info(`Connection from: ${request.socket.remoteAddress}`);

            let isAlive = true;
            let messageCount = 0;
            let rateLimitTimer: NodeJS.Timeout;
            
            ws.on('pong', () => {
                isAlive = true;
            });

            if (config.rateLimit) {
                rateLimitTimer = setInterval(() => {
                    messageCount = 0;
                }, config.rateLimit.timeWindow);
            }

            const pingInterval = setInterval(() => {
                if (!isAlive) {
                    clearInterval(pingInterval);
                    clients.delete(ws);
                    return ws.terminate();
                }
                
                isAlive = false;
                ws.ping();
            }, config.pingInterval || 30000);

            // Send welcome message
            ws.send(
                JSON.stringify({
                    type: "connection",
                    message: "Connected to WebSocket server"
                })
            );

            // Handle client messages
            ws.on("message", (data) => {
                if (config.rateLimit && ++messageCount > config.rateLimit.messages) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Rate limit exceeded'
                    }));
                    return;
                }
                logger.info("Received message:", data.toString());
                handleMessage(ws, data.toString());
            });

            // Handle client disconnection
            ws.on("close", () => {
                clients.delete(ws);
                clearInterval(pingInterval);
                if (rateLimitTimer) clearInterval(rateLimitTimer);
                logger.info(`Client disconnected. Total clients: ${clients.size}`);
            });

            // Handle errors
            ws.on("error", (err) => {
                handleError(ws, err);
            });
        } catch (error) {
            logger.error('Connection error:', error);
            ws.close(1011, 'Internal server error');
        }
    };

    const handleMessage: MessageHandler = (ws, message) => {
        try {
            const parsedMessage = JSON.parse(message) as WebSocketMessage;
            
            // Validate message structure
            if (!parsedMessage.type) {
                throw new Error('Invalid message format: missing type');
            }

            const response: ServerMessage = {
                type: 'response',
                data: parsedMessage,
                timestamp: new Date().toISOString()
            };

            ws.send(JSON.stringify(response));
        } catch (err) {
            logger.error("Error parsing message:", err);
            ws.send(
                JSON.stringify({
                    type: "error",
                    message: "Invalid message format"
                })
            );
        }
    };

    const handleError: ErrorHandler = (ws, err) => {
        logger.error("WebSocket error:", err);
        ws.send(
            JSON.stringify({
                type: "error",
                message: "Internal server error"
            })
        );
    };

    // Broadcast message to all connected clients
    const broadcast = (message: any) => {
        const messageString = JSON.stringify(message);
        clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageString);
            }
        });
    };

    const initialize = (server?: Server) => {
        wss = new WebSocketServer({
            server: server,
            path: config.path || "/",
            maxPayload: config.maxPayload || 50 * 1024
        });

        wss.on("connection", handleConnection);

        wss.on("error", (error) => {
            logger.error("WebSocket Server Error:", error);
        });

        logger.info(`WebSocket server available at ws://localhost:8000${config.path || ""}`);
    };

    const close = () => {
        if (wss) {
            // Close all client connections
            clients.forEach(client => {
                client.close(1000, 'Server shutting down');
            });
            
            // Clear the clients set
            clients.clear();
            
            // Close the server
            return new Promise<void>((resolve) => {
                wss.close(() => {
                    logger.info('WebSocket server closed');
                    resolve();
                });
            });
        }
    };

    return {
        initialize,
        broadcast,
        getClients: () => clients.size,
        close
    };
}

// ws instance
const wsServer = createWebSocketServer({
    path: "/ws",
    pingInterval: 30000,
    maxPayload: 50 * 1024,
    // rate limiting: 100 messages per minute
    rateLimit: {
        messages: 100, 
        timeWindow: 60000
    },
    // authentication handler
    authHandler: async (request) => {
        // Eg: Check for auth token in headers
        const token = request.headers['authorization'];
        if (!token) {
            logger.warn('WebSocket connection attempt without authorization');
            return false;
        }
        // add token validation logic here
        return true;
    }
});

export { createWebSocketServer };
export default wsServer;