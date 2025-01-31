import { APP_ENV } from "../constants/env.js";

// get database url
export function getDbUrl() {
    switch (process.env.NODE_ENV) {
        case APP_ENV.PROD:
            return (
                process.env.DB_URL ||
                "postgresql://postgres:password@localhost:5432/node_api_prod_db"
            );

        case APP_ENV.TEST:
            return (
                process.env.TEST_DB_URL ||
                "postgresql://postgres:password@localhost:5432/node_api_test_db"
            );

        default:
            return (
                process.env.DB_URL ||
                "postgresql://postgres:password@localhost:5432/node_api_dev_db"
            );
    }
}

// validate test database
export const validateTestDatabase = (dbUrl: string) => {
    try {
        // Parse the database URL
        const url = new URL(dbUrl);
        const dbName = url.pathname.split("/").pop();

        if (!dbName?.includes("_test")) {
            console.error(`
                ⚠️  DANGER: Test database name must end with '_test' ⚠️
                Current database: ${dbName}
                This check exists to prevent accidental test runs on production databases.
                Please update TEST_DB_URL to point to a test database.
                `);
            process.exit(1);
        }
    } catch (error) {
        console.error(`
            Invalid database URL: ${dbUrl}
            Please check your TEST_DB_URL environment variable.
            `);
        process.exit(1);
    }
};
