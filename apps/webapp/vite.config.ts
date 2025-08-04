import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vite expects local dependencies to be exported as ES Modules but shared-models is built as CommonJS
  // https://vitejs.dev/guide/dep-pre-bundling#monorepos-and-linked-dependencies
  optimizeDeps: {
    include: ["shared-models"],
  },
  build: {
    commonjsOptions: {
      include: [/shared-models/, /node_modules/],
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  // Vite doesn't allow to watch node_modules changes,
  // so we can't listen on shared-models changes.
  // We have to re-install packages and restart the dev server.
  // https://github.com/vitejs/vite/issues/8619
});
