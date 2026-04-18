import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    // Strip all console.* calls in production builds
    minify: "esbuild",
    target: "es2020",
  },
  esbuild: {
    // Drop console and debugger statements in production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
  },
});
