import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    port: 6060
  },
  build: {
    outDir: "dist",
    assetsDir: ".",
    rollupOptions: {
      input: "index.html"
    }
  }
});
