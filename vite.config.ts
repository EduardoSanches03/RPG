import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Dev em "/" para facilitar navegacao local; build com base do GitHub Pages.
  base: command === "build" ? "/RPG/" : "/",
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    exclude: ["apps/**", "node_modules/**", "dist/**"],
    css: true,
    globals: true,
    restoreMocks: true,
    clearMocks: true,
  },
}));
