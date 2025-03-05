import morgan from "morgan";
import logger from "../config/logger/logger.js";

const stream = {
    write: (message: string) => logger.http(message),
};

const MorganMiddleware = morgan(":method :url :status :res[content-length] - :response-time ms", { stream });

export default MorganMiddleware;