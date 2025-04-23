
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { setupWebSocketServer } from "./src/server/wsServer";
import { Plugin, ViteDevServer, ConfigEnv, UserConfigExport } from "vite";
import { Server as HttpServer } from "http";

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfigExport => {
  return {
    server: {
      host: "::",
      port: 8080,
      open: true,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      {
        name: 'setup-websocket',
        configureServer(server: ViteDevServer) {
          if (server.httpServer) {
            setupWebSocketServer(server.httpServer as HttpServer);
          }
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
