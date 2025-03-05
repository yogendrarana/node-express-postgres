import pg from "pg";
import dotenv from "dotenv";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";
import { getTableName, sql } from "drizzle-orm";
import { env } from "../src/config/env.config.js";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/config/db/schema.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { validateTestDatabase } from "../src/helpers/db.helpers.js";

// load env variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Get and validate database URL
const testDbUrl = env.TEST_DB_URL;
validateTestDatabase(testDbUrl);

// create database connection
export const testDbPool = new pg.Pool({ connectionString: testDbUrl });
export const testDb = drizzle(testDbPool, { schema });

beforeAll(async () => {
    if (env.NODE_ENV !== 'test') {
        throw new Error('Tests must be run in test environment');
    }
    try {
        // Log the environment we're running in
        console.log(
            `🧪 Starting tests in environment: ${
                process.env.NODE_ENV || "test"
            } 📊 Database: ${testDbUrl} `
        );

        // Run migrations on the test database
        await migrate(testDb, { migrationsFolder: "drizzle" });
    } catch (error: any) {
        console.error("❌ Migration failed:", error.message);
        process.exit(1);
    }
});

afterAll(async () => {
    if (env.NODE_ENV === 'test') {
        await testDbPool.end();
        console.log("✓ Database connection closed");
    }
});

// helper function to truncate tables
export const truncateTables = async (tableNames?: string[]) => {
    const allTableNames = Object.values(schema)
        .map((item) => getTableName(item as any))
        .filter((name): name is string => name !== undefined);

    const tablesToTruncate = tableNames || allTableNames;

    for (const tableName of tablesToTruncate) {
        try {
            await testDb.execute(sql`TRUNCATE TABLE ${sql.identifier(tableName)} CASCADE`);
        } catch (error) {
            console.error(`Failed to truncate table ${tableName}:`, error);
        }
    }
};
