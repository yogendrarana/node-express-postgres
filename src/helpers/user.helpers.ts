import { eq } from "drizzle-orm";
import { db } from "../config/db/db.js";
import { type InsertableUser, type SelectableUser, userSchema } from "../config/db/schema/user.schema.js";

// get user by email
export const getUserByEmail = async (email: string): Promise<SelectableUser | undefined> => {
    const [user] = await db.select().from(userSchema).where(eq(userSchema.email, email));
    return user;
};

// get user by id
export const getUserById = async (userId: string): Promise<SelectableUser | undefined> => {
    const [user] = await db.select().from(userSchema).where(eq(userSchema.id, userId));
    return user;
};

// insert user
export const insertUser = async (userData: Partial<InsertableUser>) => {
    const userValues = Object.fromEntries(
        Object.entries(userData).filter(([, value]) => value !== undefined)
    ) as InsertableUser;

    const [user] = await db.insert(userSchema).values(userValues).returning();

    return user;
};

// update user
export const updateUser = async (userId: string, userData: Partial<InsertableUser>) => {
    const userValues = Object.fromEntries(
        Object.entries(userData).filter(([, value]) => value !== undefined)
    ) as InsertableUser;

    const [user] = await db
        .update(userSchema)
        .set(userValues)
        .where(eq(userSchema.id, userId))
        .returning();

    return user;
};
