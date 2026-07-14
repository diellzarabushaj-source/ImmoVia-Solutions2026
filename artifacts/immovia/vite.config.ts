import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

function resolvePort(): number {
  const parsed = Number(process.env.PORT ?? 5173);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5173;
}

function resolveBasePath(): string {
  const value = process.env.BASE_PATH?.trim();
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [react(), tailwindcss({ optimize: false })];

  // Replit-only development helpers must never be required for production or
  // Vercel builds. Keeping them behind this guard allows the same repository to
  // remain usable in Replit without coupling the production build to Replit.
  if (mode !== "production" && process.env.REPL_ID) {
    const [{ cartographer }, { devBanner }] = await Promise.all([
      import("@replit/vite-plugin-cartographer"),
      import("@replit/vite-plugin-dev-banner"),
    ]);

    plugins.push(
      runtimeErrorOverlay(),
      cartographer({
        root: path.resolve(import.meta.dirname, ".."),
      }),
      devBanner(),
    );
  }

  const port = resolvePort();

  return {
    base: resolveBasePath(),
    plugins,
    define: {
      global: "globalThis",
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
