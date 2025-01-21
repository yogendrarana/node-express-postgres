import jwt from "jsonwebtoken";
import { db } from "../db/db.js";
import { tokenSchema, type InsertableToken } from "../db/schema.js";
import { eq } from "drizzle-orm";

// create access token
export const createAccessToken = function (userId: string, userRole: string) {
    return jwt.sign({ userId, userRole }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "1m" });
};

// create refresh token of random uuid
export const createRefreshToken = function (userId: string, userRole: string) {
    return jwt.sign({ userId, userRole }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "1d" });
};

// insert token
export const insertToken = async function (tokenData: InsertableToken) {
    const [token] = await db
        .insert(tokenSchema)
        .values({ type: tokenData.type, value: tokenData.value, userId: tokenData.userId })
        .returning({
            id: tokenSchema.id,
            type: tokenSchema.type,
            value: tokenSchema.value,
            userId: tokenSchema.userId
        });

    return token;
};

// get token by value
export const getTokenByValue = async function (value: string) {
    const token = await db.query.tokenSchema.findFirst({
        where: eq(tokenSchema.value, value),
        with: {
            user: true
        }
    });

    return token;
};

// delete token by value
export const deleteTokenByValue = async function (value: string) {
    await db.delete(tokenSchema).where(eq(tokenSchema.value, value));
};
