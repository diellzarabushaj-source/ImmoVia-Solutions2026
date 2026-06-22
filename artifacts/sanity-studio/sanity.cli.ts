import type { Plugin } from "vite";
import { defineCliConfig } from "sanity/cli";

// bridge.js is injected by Sanity's runtime into the HTML template.
// In the Replit environment it loads late from the CDN and brings a second
// React instance, which causes "Invalid hook call". Strip it out — we don't
// need the Sanity dashboard bridge when running the studio standalone.
const removeBridgeScript: Plugin = {
  name: "remove-sanity-bridge",
  transformIndexHtml(html) {
    return html.replace(
      /<script[^>]*sanity-cdn\.[a-z]+\/bridge\.js[^>]*><\/script>\s*/g,
      ""
    );
  },
};

export default defineCliConfig({
  api: {
    projectId: "c0tinigu",
    dataset: "production",
  },
  vite(config) {
    return {
      ...config,
      base: "/studio/",
      server: {
        ...(config.server ?? {}),
        host: "0.0.0.0",
        allowedHosts: true as const,
      },
      build: {
        ...(config.build ?? {}),
        target: "esnext",
      },
      plugins: [...(config.plugins ?? []), removeBridgeScript],
      optimizeDeps: {
        ...(config.optimizeDeps ?? {}),
        esbuildOptions: {
          ...(config.optimizeDeps?.esbuildOptions ?? {}),
          target: "esnext",
        },
      },
    };
  },
});
