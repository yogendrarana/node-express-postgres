import { z } from "zod";
import path from "path";
import dotenv from "dotenv";
import { createEnv } from "@t3-oss/env-core";

// Load environment variables before validation
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = createEnv({
    server: {
        PORT: z.coerce.number().default(8000),
        SERVER_URL: z.string().url(),
        NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

        // Authentication tokens
        ACCESS_TOKEN_SECRET: z.string().min(1),
        REFRESH_TOKEN_SECRET: z.string().min(1),

        // Other API keys
        RESEND_API_KEY: z.string().optional(),

        // Google OAuth credentials
        GOOGLE_CLIENT_ID: z.string(),
        GOOGLE_CLIENT_SECRET: z.string(),

        // Database URLs
        DATABASE_URL: z.string().url(),
        TEST_DB_URL: z.string().url(),

        // Monitoring
        SENTRY_DSN: z.string().optional()
    },

    // Required to work with server-side environment variables
    runtimeEnv: process.env,

    // Optional: Custom error handler
    onValidationError: (error) => {
        console.error("❌ Invalid environment variables:", error);
        throw new Error("Invalid environment variables");
    }
});
