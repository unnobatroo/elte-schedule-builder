import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    host: true,
    port: Number(process.env.VITE_DEV_SERVER_PORT) || 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
