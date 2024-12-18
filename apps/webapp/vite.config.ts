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
});
