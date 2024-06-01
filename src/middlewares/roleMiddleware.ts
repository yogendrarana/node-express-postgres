import { Response, NextFunction } from 'express';
import ErrorHandler from '../util/errorHandler.js';
import { AuthenticatedRequest } from '../types/index.js';

export const verifyAdminRole = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
        return next(new ErrorHandler(403, "User does not have admin role to access this resource."));
    }

    next();
};
