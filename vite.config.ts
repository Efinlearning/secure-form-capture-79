
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { setupWebSocketServer } from "./src/server/wsServer";
import { Server } from "http";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    setupWebSocket: true,
    open: true,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    {
      name: 'setup-websocket',
      configureServer(server: { httpServer: Server }) {
        setupWebSocketServer(server.httpServer);
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
