import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Sistema Integral MIF",
        short_name: "MIF",
        description: "Caja chica, ahorros, aportaciones e ingresos de la Cooperativa MIF",
        theme_color: "#1f6f5c",
        background_color: "#eef1ea",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        // Fase 1: deja la app instalable y cachea el shell de la interfaz.
        // La cola de sincronización de movimientos sin conexión se construye
        // en la fase 4 del plan (ver la propuesta de arquitectura).
        globPatterns: ["**/*.{js,css,html,svg}"],
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: { enabled: false },
    }),
  ],
});
