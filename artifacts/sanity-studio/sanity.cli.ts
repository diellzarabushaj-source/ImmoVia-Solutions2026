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
  studioHost: "immovia-blog",
  vite(config) {
    return {
      ...config,
      // REPLIT_BUILD=1 → building for Replit proxy (needs /studio/ base so the
      // Replit path-based proxy routes /studio/static/... to the right service).
      // Sanity deploy → omit so Sanity CLI sets the correct root base for
      // immovia-blog.sanity.studio where assets live at /static/...
      base: process.env.REPLIT_BUILD ? "/studio/" : (config.base ?? "/"),
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
