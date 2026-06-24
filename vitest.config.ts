import { defineConfig, configDefaults } from "vitest/config";
import { defineWorkersProject } from "@cloudflare/vitest-pool-workers/config";

export default defineConfig({
  test: {
    projects: [
      // Node behavior tests: jq output, API surface, regression guards.
      {
        test: {
          name: "node",
          environment: "node",
          include: ["src/tests/**/*.test.ts"],
          exclude: [...configDefaults.exclude, "**/*.workers.test.ts"],
        },
      },
      // Cloudflare Workers runtime tests, executed under workerd.
      defineWorkersProject({
        test: {
          name: "workers",
          include: ["src/tests/**/*.workers.test.ts"],
          poolOptions: {
            workers: {
              wrangler: { configPath: "./wrangler.toml" },
            },
          },
        },
      }),
    ],
  },
});
