// vite.config.ts
import { defineConfig } from "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/node_modules/.pnpm/vite@5.4.19_@types+node@22.19.3/node_modules/vite/dist/node/index.js";
import { wsx } from "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/packages/vite-plugin/dist/index.mjs";
import path from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/packages/base-components/vite.config.ts";
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "WSXBaseComponents",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`
    },
    rollupOptions: {
      external: ["@wsxjs/wsx-core"],
      output: {
        globals: {
          "@wsxjs/wsx-core": "WSXCore"
        }
      }
    },
    cssCodeSplit: false,
    // 禁用CSS代码分割，确保CSS内联到JS中
    sourcemap: process.env.NODE_ENV === "development"
    // 只在开发环境生成 source maps
  },
  plugins: [
    wsx({
      debug: false,
      jsxFactory: "jsx",
      jsxFragment: "Fragment"
    })
  ],
  // Resolve workspace packages to source files in development mode
  // In production, Vite will use package.json exports (dist files)
  resolve: {
    alias: process.env.NODE_ENV === "development" ? {
      "@wsxjs/wsx-core": path.resolve(__dirname, "../core/src/index.ts")
    } : void 0
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVm9sdW1lcy9PUklDTy93cy9wcmovd3N4L3dzeGpzL3BhY2thZ2VzL2Jhc2UtY29tcG9uZW50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1ZvbHVtZXMvT1JJQ08vd3MvcHJqL3dzeC93c3hqcy9wYWNrYWdlcy9iYXNlLWNvbXBvbmVudHMvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1ZvbHVtZXMvT1JJQ08vd3MvcHJqL3dzeC93c3hqcy9wYWNrYWdlcy9iYXNlLWNvbXBvbmVudHMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgd3N4IH0gZnJvbSBcIkB3c3hqcy93c3gtdml0ZS1wbHVnaW5cIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSBcInVybFwiO1xuXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgICBidWlsZDoge1xuICAgICAgICBsaWI6IHtcbiAgICAgICAgICAgIGVudHJ5OiBcInNyYy9pbmRleC50c1wiLFxuICAgICAgICAgICAgbmFtZTogXCJXU1hCYXNlQ29tcG9uZW50c1wiLFxuICAgICAgICAgICAgZm9ybWF0czogW1wiZXNcIiwgXCJjanNcIl0sXG4gICAgICAgICAgICBmaWxlTmFtZTogKGZvcm1hdCkgPT4gYGluZGV4LiR7Zm9ybWF0ID09PSBcImVzXCIgPyBcImpzXCIgOiBcImNqc1wifWAsXG4gICAgICAgIH0sXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIGV4dGVybmFsOiBbXCJAd3N4anMvd3N4LWNvcmVcIl0sXG4gICAgICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiQHdzeGpzL3dzeC1jb3JlXCI6IFwiV1NYQ29yZVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBjc3NDb2RlU3BsaXQ6IGZhbHNlLCAvLyBcdTc5ODFcdTc1MjhDU1NcdTRFRTNcdTc4MDFcdTUyMDZcdTUyNzJcdUZGMENcdTc4NkVcdTRGRERDU1NcdTUxODVcdTgwNTRcdTUyMzBKU1x1NEUyRFxuICAgICAgICBzb3VyY2VtYXA6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcImRldmVsb3BtZW50XCIsIC8vIFx1NTNFQVx1NTcyOFx1NUYwMFx1NTNEMVx1NzNBRlx1NTg4M1x1NzUxRlx1NjIxMCBzb3VyY2UgbWFwc1xuICAgIH0sXG4gICAgcGx1Z2luczogW1xuICAgICAgICB3c3goe1xuICAgICAgICAgICAgZGVidWc6IGZhbHNlLFxuICAgICAgICAgICAganN4RmFjdG9yeTogXCJqc3hcIixcbiAgICAgICAgICAgIGpzeEZyYWdtZW50OiBcIkZyYWdtZW50XCIsXG4gICAgICAgIH0pLFxuICAgIF0sXG4gICAgLy8gUmVzb2x2ZSB3b3Jrc3BhY2UgcGFja2FnZXMgdG8gc291cmNlIGZpbGVzIGluIGRldmVsb3BtZW50IG1vZGVcbiAgICAvLyBJbiBwcm9kdWN0aW9uLCBWaXRlIHdpbGwgdXNlIHBhY2thZ2UuanNvbiBleHBvcnRzIChkaXN0IGZpbGVzKVxuICAgIHJlc29sdmU6IHtcbiAgICAgICAgYWxpYXM6XG4gICAgICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJkZXZlbG9wbWVudFwiXG4gICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgXCJAd3N4anMvd3N4LWNvcmVcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi9jb3JlL3NyYy9pbmRleC50c1wiKSxcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBWLFNBQVMsb0JBQW9CO0FBQ3ZYLFNBQVMsV0FBVztBQUNwQixPQUFPLFVBQVU7QUFDakIsU0FBUyxxQkFBcUI7QUFIMEwsSUFBTSwyQ0FBMkM7QUFLelEsSUFBTSxZQUFZLEtBQUssUUFBUSxjQUFjLHdDQUFlLENBQUM7QUFFN0QsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsT0FBTztBQUFBLElBQ0gsS0FBSztBQUFBLE1BQ0QsT0FBTztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sU0FBUyxDQUFDLE1BQU0sS0FBSztBQUFBLE1BQ3JCLFVBQVUsQ0FBQyxXQUFXLFNBQVMsV0FBVyxPQUFPLE9BQU8sS0FBSztBQUFBLElBQ2pFO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDWCxVQUFVLENBQUMsaUJBQWlCO0FBQUEsTUFDNUIsUUFBUTtBQUFBLFFBQ0osU0FBUztBQUFBLFVBQ0wsbUJBQW1CO0FBQUEsUUFDdkI7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBLElBQ0EsY0FBYztBQUFBO0FBQUEsSUFDZCxXQUFXLFFBQVEsSUFBSSxhQUFhO0FBQUE7QUFBQSxFQUN4QztBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ0wsSUFBSTtBQUFBLE1BQ0EsT0FBTztBQUFBLE1BQ1AsWUFBWTtBQUFBLE1BQ1osYUFBYTtBQUFBLElBQ2pCLENBQUM7QUFBQSxFQUNMO0FBQUE7QUFBQTtBQUFBLEVBR0EsU0FBUztBQUFBLElBQ0wsT0FDSSxRQUFRLElBQUksYUFBYSxnQkFDbkI7QUFBQSxNQUNJLG1CQUFtQixLQUFLLFFBQVEsV0FBVyxzQkFBc0I7QUFBQSxJQUNyRSxJQUNBO0FBQUEsRUFDZDtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
