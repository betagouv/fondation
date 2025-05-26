import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      css: {}, // Vite will process CSS files natively
    },
  },
  test: {
    css: true,
    globals: true,
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom", "./vitest/vitest.setup.ts"],
  },
});
