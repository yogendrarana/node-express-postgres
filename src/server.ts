import http from "node:http";
import wsServer from "./config/socket.js";
import { createExpressApp } from "./app.js";
import { env } from "./config/env.config.js";
import logger from "./config/logger/logger.js";
import { startCronJobs } from "./cron/cronjob.js";

// config
startCronJobs();

// create express app
const app = createExpressApp();

// create server
const PORT = env.PORT;
const server = http.createServer(app);

// attach websocket server to the HTTP server
wsServer.initialize(server);

// handle graceful shutdown
const shutdown = async () => {
    logger.info('Shutting down server...');
    
    await wsServer.close();    
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
};

// handle process termination
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// start http server
server.listen(PORT, () => {
    logger.info(`HTTP Server running on port ${PORT}`);
    logger.info(`WebSocket server available at ws://localhost:${PORT}/ws`);
});
