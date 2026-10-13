import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
    env: {
      GMAIL_USER: "",
      GMAIL_APP_PASSWORD: "",
      RESEND_API_KEY: "",
      ORDER_NOTIFICATION_FROM: "",
      ORDER_NOTIFICATION_EMAIL: "",
    },
  },
});
