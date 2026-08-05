import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { readHttpUrl, readPort } from "./runtime-config.js";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [svelte()],
    server: {
      host: true,
      port: readPort(env.VITE_DEV_SERVER_PORT, 5173, "VITE_DEV_SERVER_PORT"),
      proxy: {
        "/api": {
          target: readHttpUrl(
            env.VITE_API_PROXY_TARGET,
            "http://localhost:3000",
            "VITE_API_PROXY_TARGET",
          ),
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
