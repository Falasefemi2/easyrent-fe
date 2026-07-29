import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin"

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    // Enables Vite to resolve imports using path aliases.
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: ".",
      router: {
        routesDirectory: "app/routes",
        generatedRouteTree: "app/routeTree.gen.ts",
        entry: "./app/router.tsx",
      },
    }),
    viteReact(),
    nitroV2Plugin(/* { target: 'vercel' } — optional, Vercel usually auto-detects */),
  ],
})
