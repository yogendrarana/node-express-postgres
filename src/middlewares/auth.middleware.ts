import jwt from "jsonwebtoken";
import passport from "passport";
import { eq } from "drizzle-orm";
import { db } from "../../drizzle/index.js";
import ErrorHandler from "../helpers/error.helpers.js";
import { userSchema } from "../../drizzle/schema/user.schema.js";
import type { NextFunction, Request, Response } from "express";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { getUserByEmail, getUserById, insertUser } from "../helpers/user.helpers.js";
import { env } from "../config/env.config.js";

// Define a custom interface that extends the Express Request interface
interface AuthenticatedRequest extends Request {
    user?: any;
}

export const verifyAccessToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || req.headers.Authoriztion;
    if (!authHeader || !(authHeader as string).startsWith("Bearer ")) {
        throw new ErrorHandler(401, "Bearer token is not available!");
    }

    const accessToken = (authHeader as string).split(" ")[1];
    if (!accessToken) {
        return next(new ErrorHandler(401, "Access token is not available!"));
    }

    jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
        // handle error
        if (err) {
            if (err.name === "TokenExpiredError") {
                return next(new ErrorHandler(401, "Access token expired!"));
            } else if (err.name === "JsonWebTokenError") {
                return next(new ErrorHandler(401, "Invalid access token!"));
            } else {
                return next(new ErrorHandler(401, "Unauthorized!"));
            }
        }

        // get user associated with access token
        const userId = (decoded as any).id;
        const user = await db.query.userSchema.findFirst({ where: eq(userSchema.id, userId) });
        if (!user) {
            return next(
                new ErrorHandler(401, "User associated with the accesss token does not exist!")
            );
        }

        req.user = user;
        next();
    });
};

// passport google oauth2.0 strategy
export const initializeGoogleOAuth2 = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
                callbackURL: `${env.SERVER_URL}/auth/google/callback`,
                passReqToCallback: true,
                scope: ["profile", "email"]
            },
            async (req, accessToken, refreshToken, profile, done) => {
                const googleId = profile.id;
                const name = profile.displayName;
                const email = profile.emails?.[0]?.value;
                if (!email) {
                    return done(new Error("No email found in Google profile"));
                }

                try {
                    // check if user already exists
                    let user = await getUserByEmail(email);

                    if (!user) {
                        user = await insertUser({
                            name,
                            email,
                            googleId
                        });
                    }

                    return done(null, user);
                } catch (err) {
                    return done(err, undefined);
                }
            }
        )
    );

    // serialize user
    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    // deserialize user
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await getUserById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
