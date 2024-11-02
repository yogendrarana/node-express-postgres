import { defineConfig } from "drizzle-kit";

const connectionString =
    process.env.DB_URL || "postgresql://postgres:password@localhost:5432/node-postgres-boilerplate";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/db/schema/*",
    out: "./drizzle",
    dbCredentials: {
        url: connectionString
    },
    migrations: {
        prefix: "timestamp",
        table: "__drizzle_migrations",
        schema: "public"
    },
    extensionsFilters: ["postgis"]
});
