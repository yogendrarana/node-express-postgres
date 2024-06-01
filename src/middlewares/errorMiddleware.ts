import { NextFunction, Request, Response } from "express";

const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {

    err.status = err.status || 500;
    err.message = err.message || "Internal Server Error";

    res.status(err.status).json({
        success: false,
        message: err.message
    })
}

export default ErrorMiddleware;