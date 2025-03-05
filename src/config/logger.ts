import * as winston from 'winston';
import { createLogger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
const { combine, timestamp, json, errors, colorize } = winston.format;

const env = process.env;
const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const logLevel = env.NODE_ENV === 'production' ? 'error' : 'debug';

const errorLogsTransport = new winston.transports.DailyRotateFile({
    filename: '/tmp/winston-logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '50m',
    maxFiles: '180d',
    level: 'error'
});

const allLogsTransport = new DailyRotateFile({
    filename: '/tmp/winston-logs/all-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '50m',
    maxFiles: '180d'
});

const logger = createLogger({
    level: logLevel,
    levels,
    format: combine(
        timestamp(),
        json(),
        colorize(),
        errors({ stack: true }),
    ),
    transports: [
        new winston.transports.Console(),
        allLogsTransport,
        errorLogsTransport
    ]
});

export default logger;