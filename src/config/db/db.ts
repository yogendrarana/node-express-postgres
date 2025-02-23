import pg from "pg";
import * as schema from "./schema.js";
import { getDbUrl } from "../../helpers/db.helpers.js";
import { drizzle } from "drizzle-orm/node-postgres";

// create pool connection
export const pool = new pg.Pool({ connectionString: getDbUrl() });

// create drizzle instance
export const db = drizzle(pool, { schema });
