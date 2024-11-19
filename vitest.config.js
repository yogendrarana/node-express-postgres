import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["./test/setup.ts"],
        coverage: {
            reporter: ["text", "html"]
        },
        include: ["**/*.test.ts"]
    }
});
