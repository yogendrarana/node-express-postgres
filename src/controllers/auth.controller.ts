import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../config/db/db.js";
import { env } from "../config/env.config.js";
import ErrorHandler from "../helpers/error.helpers.js";
import { TOKEN_TYPE } from "../constants/enum/index.js";
import { userSchema } from "../config/db/schema/user.schema.js";
import { tokenSchema } from "../config/db/schema/token.schema.js";
import { asyncHandler } from "../helpers/async.helpers.js";
import type { NextFunction, Request, Response } from "express";
import { loginUserSchema, registerUserSchema } from "../schemas/user.js";
import { getUserByEmail, insertUser } from "../helpers/user.helpers.js";
import {
    createAccessToken,
    createRefreshToken,
    deleteTokenByValue,
    getTokenByValue,
    insertToken
} from "../helpers/token.helpers.js";

// registerUser
export const registerUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { email, password, confirm_password } = req.body;

        const validate = await registerUserSchema.safeParse({ email, password, confirm_password });
        if (!validate.success) {
            const errorMessage = validate.error.errors[0]?.message || "Validation error";
            return next(new ErrorHandler(400, errorMessage));
        }

        // check if user exists in database
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return next(new ErrorHandler(400, "The email is already registered. Please login."));
        }

        // encrypt password
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await insertUser({ email, password: hashedPassword });

        if (!user) {
            return next(new ErrorHandler(500, "User registration failed."));
        }

        // generate tokens
        const accessToken = createAccessToken(user.id, user.role);
        const refreshToken = createRefreshToken(user.id, user.role);

        // save refresh token in database
        await insertToken({ type: TOKEN_TYPE.REFRESH_TOKEN, value: refreshToken, userId: user.id });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            message: "Registered successfully.",
            data: {
                accessToken,
                user
            }
        });
    }
);

// loginUser
export const loginUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const validate = await loginUserSchema.safeParse({ email, password });
    if (!validate.success) {
        const errorMessage = validate.error.errors[0]?.message || "Validation error";
        return next(new ErrorHandler(400, errorMessage));
    }

    const user = await getUserByEmail(email);
    const isCorrectPassword = await bcrypt.compare(password, user?.password || "");
    if (!user || !isCorrectPassword) {
        req.failedLoginAttempts = (req.failedLoginAttempts || 0) + 1;
        return next(new ErrorHandler(400, "Invalid email or password."));
    }

    // generate token
    const accessToken = createAccessToken(user.id, user.role);
    const refreshToken = createRefreshToken(user.id, user.role);

    // save refresh token in database
    await insertToken({ type: TOKEN_TYPE.REFRESH_TOKEN, value: refreshToken, userId: user.id });

    // set refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // client cannot access cookie
        secure: true, // set to true if your using https
        sameSite: "none", // 'none' | 'lax' | 'strict'
        maxAge: 30 * 24 * 60 * 60 * 1000 // 7 days
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, createdAt, updatedAt, ...rest } = user;

    res.status(200).json({
        success: true,
        message: "Logged in successfully.",
        data: {
            accessToken,
            user: rest
        }
    });
});

// logoutUser
export const logoutUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return next(new ErrorHandler(400, "Please login first to logout."));
    }

    const foundRefreshToken = await getTokenByValue(refreshToken);

    if (!foundRefreshToken || !foundRefreshToken.user) {
        return next(new ErrorHandler(400, "Please login first to logout."));
    }

    // delete refresh token from database
    await deleteTokenByValue(refreshToken);

    // clear cookie
    res.clearCookie("refreshToken");
    res.status(200).json({
        success: true,
        message: "Logged out successfully."
    });
});

// refresh and issue new tokens
export const refreshAccessToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return next(new ErrorHandler(403, "Refresh token not found in cookie."));
        }

        jwt.verify(
            refreshToken,
            env.REFRESH_TOKEN_SECRET!,
            async (err: any, decoded: any) => {
                // handle error
                if (err) {
                    if (err.name === "TokenExpiredError") {
                        return next(new ErrorHandler(401, "Refresh token expired!"));
                    } else if (err.name === "JsonWebTokenError") {
                        return next(new ErrorHandler(401, "Invalid access token!"));
                    } else {
                        return next(new ErrorHandler(401, "Unauthorized!"));
                    }
                }

                // get user associated with refresh token
                const userId = decoded.userId;
                const user = await db.query.userSchema.findFirst({
                    where: eq(userSchema.id, userId)
                });
                if (!user) {
                    return next(
                        new ErrorHandler(
                            401,
                            "User associated with the refresh token does not exist!"
                        )
                    );
                }

                // delete the last refresh token from database
                await db.delete(tokenSchema).where(eq(tokenSchema.value, refreshToken));

                // crate new access token and refresh token
                const newwAccessToken = createAccessToken(user.id, user.role);
                const newRefreshToken = createRefreshToken(user.id, user.role);

                // insert new refresh token in database
                await db.insert(tokenSchema).values({
                    type: TOKEN_TYPE.REFRESH_TOKEN,
                    value: newRefreshToken,
                    userId: user.id
                });

                res.cookie("refreshToken", newRefreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    maxAge: 30 * 24 * 60 * 60 * 1000
                });

                res.status(200).json({
                    success: true,
                    message: "Access token generated successfully!",
                    data: {
                        accessToken: newwAccessToken,
                        user
                    }
                });
            }
        );
    }
);

// google auth callback
export const googleAuthCallback = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as any;

        if (!user) {
            return next(new ErrorHandler(401, "Google authentication failed."));
        }

        // Generate tokens
        const accessToken = createAccessToken(user.id, user.role);
        const refreshToken = createRefreshToken(user.id, user.role);

        // Save refresh token in the database
        await insertToken({
            type: TOKEN_TYPE.REFRESH_TOKEN,
            value: refreshToken,
            userId: user.id
        });

        // Set refresh token in cookies
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        // Respond with access token and user data
        res.status(200).json({
            success: true,
            message: "Authenticated successfully with Google.",
            data: {
                accessToken,
                user
            }
        });
    }
);
