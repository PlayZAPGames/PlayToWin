import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      svelte({
        onwarn: (warning, defaultHandler) => {
          // List of a11y warnings to ignore
          const ignoredWarnings = [
            'a11y-click-events-have-key-events',
            'a11y-no-static-element-interactions',
            'a11y-label-has-associated-control',
            'a11y-missing-attribute'
          ];
          
          if (ignoredWarnings.includes(warning.code)) return;
          defaultHandler(warning);
        }
      })
    ],
    server: {
      port: parseInt(env.VITE_PORT) || 2040,
      proxy: {
        "/api": env.VITE_API_BASE_URL || "http://localhost:2039",
      },
    },
    preview: {
      port: parseInt(env.VITE_PORT) || 2040
    }
  };
});
