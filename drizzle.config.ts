import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env.config";

const connectionString = env.DATABASE_URL;

export default defineConfig({
    dialect: "postgresql",
    schema: "./drizzle/schema/*",
    out: "./drizzle/migrations",
    dbCredentials: {
        url: connectionString
    },
    migrations: {
        prefix: "timestamp",
        table: "drizzle_migrations",
        schema: "public"
    },
    extensionsFilters: ["postgis"]
});
