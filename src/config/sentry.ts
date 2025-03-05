import { env } from "./env.config.js";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export const configureSentry = () => {   
    Sentry.init({
            dsn: env.SENTRY_DSN,
        integrations: [
            nodeProfilingIntegration(),
        ],
        
        debug: true,
        attachStacktrace: true,
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
    });
}

export default Sentry;
