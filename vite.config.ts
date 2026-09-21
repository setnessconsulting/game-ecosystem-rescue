import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

// The games-site release contract serves the game from an immutable versioned subpath
// (<slug>/<version>/), so nothing may assume it is at the domain root: `base` is relative by
// default and overridden by GAME_ASSET_BASE for the subpath build that CI verifies.
export default defineConfig({
  base: process.env.GAME_ASSET_BASE ?? "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
