// vite.config.ts
import { defineConfig } from "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/node_modules/.pnpm/vite@5.4.19_@types+node@22.19.3/node_modules/vite/dist/node/index.js";
import { wsx } from "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/packages/vite-plugin/dist/index.mjs";
import path from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/packages/marked-components/vite.config.ts";
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "WSXMarkedComponents",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`
    },
    rollupOptions: {
      external: ["@wsxjs/wsx-core", "marked"],
      output: {
        globals: {
          "@wsxjs/wsx-core": "WSXCore",
          marked: "marked"
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVm9sdW1lcy9PUklDTy93cy9wcmovd3N4L3dzeGpzL3BhY2thZ2VzL21hcmtlZC1jb21wb25lbnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVm9sdW1lcy9PUklDTy93cy9wcmovd3N4L3dzeGpzL3BhY2thZ2VzL21hcmtlZC1jb21wb25lbnRzL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Wb2x1bWVzL09SSUNPL3dzL3Byai93c3gvd3N4anMvcGFja2FnZXMvbWFya2VkLWNvbXBvbmVudHMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgd3N4IH0gZnJvbSBcIkB3c3hqcy93c3gtdml0ZS1wbHVnaW5cIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSBcInVybFwiO1xuXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgICBidWlsZDoge1xuICAgICAgICBsaWI6IHtcbiAgICAgICAgICAgIGVudHJ5OiBcInNyYy9pbmRleC50c1wiLFxuICAgICAgICAgICAgbmFtZTogXCJXU1hNYXJrZWRDb21wb25lbnRzXCIsXG4gICAgICAgICAgICBmb3JtYXRzOiBbXCJlc1wiLCBcImNqc1wiXSxcbiAgICAgICAgICAgIGZpbGVOYW1lOiAoZm9ybWF0KSA9PiBgaW5kZXguJHtmb3JtYXQgPT09IFwiZXNcIiA/IFwianNcIiA6IFwiY2pzXCJ9YCxcbiAgICAgICAgfSxcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgZXh0ZXJuYWw6IFtcIkB3c3hqcy93c3gtY29yZVwiLCBcIm1hcmtlZFwiXSxcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIGdsb2JhbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJAd3N4anMvd3N4LWNvcmVcIjogXCJXU1hDb3JlXCIsXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlZDogXCJtYXJrZWRcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgY3NzQ29kZVNwbGl0OiBmYWxzZSwgLy8gXHU3OTgxXHU3NTI4Q1NTXHU0RUUzXHU3ODAxXHU1MjA2XHU1MjcyXHVGRjBDXHU3ODZFXHU0RkREQ1NTXHU1MTg1XHU4MDU0XHU1MjMwSlNcdTRFMkRcbiAgICAgICAgc291cmNlbWFwOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJkZXZlbG9wbWVudFwiLCAvLyBcdTUzRUFcdTU3MjhcdTVGMDBcdTUzRDFcdTczQUZcdTU4ODNcdTc1MUZcdTYyMTAgc291cmNlIG1hcHNcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgd3N4KHtcbiAgICAgICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgICAgIGpzeEZhY3Rvcnk6IFwianN4XCIsXG4gICAgICAgICAgICBqc3hGcmFnbWVudDogXCJGcmFnbWVudFwiLFxuICAgICAgICB9KSxcbiAgICBdLFxuICAgIC8vIFJlc29sdmUgd29ya3NwYWNlIHBhY2thZ2VzIHRvIHNvdXJjZSBmaWxlcyBpbiBkZXZlbG9wbWVudCBtb2RlXG4gICAgLy8gSW4gcHJvZHVjdGlvbiwgVml0ZSB3aWxsIHVzZSBwYWNrYWdlLmpzb24gZXhwb3J0cyAoZGlzdCBmaWxlcylcbiAgICByZXNvbHZlOiB7XG4gICAgICAgIGFsaWFzOlxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIlxuICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgIFwiQHdzeGpzL3dzeC1jb3JlXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vY29yZS9zcmMvaW5kZXgudHNcIiksXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnVyxTQUFTLG9CQUFvQjtBQUM3WCxTQUFTLFdBQVc7QUFDcEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBSDhMLElBQU0sMkNBQTJDO0FBSzdRLElBQU0sWUFBWSxLQUFLLFFBQVEsY0FBYyx3Q0FBZSxDQUFDO0FBRTdELElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLE9BQU87QUFBQSxJQUNILEtBQUs7QUFBQSxNQUNELE9BQU87QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLFNBQVMsQ0FBQyxNQUFNLEtBQUs7QUFBQSxNQUNyQixVQUFVLENBQUMsV0FBVyxTQUFTLFdBQVcsT0FBTyxPQUFPLEtBQUs7QUFBQSxJQUNqRTtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ1gsVUFBVSxDQUFDLG1CQUFtQixRQUFRO0FBQUEsTUFDdEMsUUFBUTtBQUFBLFFBQ0osU0FBUztBQUFBLFVBQ0wsbUJBQW1CO0FBQUEsVUFDbkIsUUFBUTtBQUFBLFFBQ1o7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBLElBQ0EsY0FBYztBQUFBO0FBQUEsSUFDZCxXQUFXLFFBQVEsSUFBSSxhQUFhO0FBQUE7QUFBQSxFQUN4QztBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ0wsSUFBSTtBQUFBLE1BQ0EsT0FBTztBQUFBLE1BQ1AsWUFBWTtBQUFBLE1BQ1osYUFBYTtBQUFBLElBQ2pCLENBQUM7QUFBQSxFQUNMO0FBQUE7QUFBQTtBQUFBLEVBR0EsU0FBUztBQUFBLElBQ0wsT0FDSSxRQUFRLElBQUksYUFBYSxnQkFDbkI7QUFBQSxNQUNJLG1CQUFtQixLQUFLLFFBQVEsV0FBVyxzQkFBc0I7QUFBQSxJQUNyRSxJQUNBO0FBQUEsRUFDZDtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
