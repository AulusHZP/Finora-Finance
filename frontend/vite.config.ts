import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Proxy local `/api/*` requests to the hosted backend to avoid CORS during development
      // Usage: set `VITE_API_URL=/api` in `.env.local` and frontend will call `/api/...`
      "/api": {
        target: "https://finora-finance-h6z4.onrender.com",
        changeOrigin: true,
        secure: true,
        // Force headers the backend expects (prevents Cloudflare/Render rejecting proxied requests)
        headers: {
          Origin: "https://finora-finance-h6z4.onrender.com",
          Host: "finora-finance-h6z4.onrender.com",
        },
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
