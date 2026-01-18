// vite.config.ts
import { defineConfig } from "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/node_modules/.pnpm/vite@5.4.19_@types+node@22.19.3/node_modules/vite/dist/node/index.js";
import { wsx } from "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/packages/vite-plugin/dist/index.mjs";
import path from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/packages/router/vite.config.ts";
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "WSXRouter",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVm9sdW1lcy9PUklDTy93cy9wcmovd3N4L3dzeGpzL3BhY2thZ2VzL3JvdXRlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1ZvbHVtZXMvT1JJQ08vd3MvcHJqL3dzeC93c3hqcy9wYWNrYWdlcy9yb3V0ZXIvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1ZvbHVtZXMvT1JJQ08vd3MvcHJqL3dzeC93c3hqcy9wYWNrYWdlcy9yb3V0ZXIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgd3N4IH0gZnJvbSBcIkB3c3hqcy93c3gtdml0ZS1wbHVnaW5cIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSBcInVybFwiO1xuXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgICBidWlsZDoge1xuICAgICAgICBsaWI6IHtcbiAgICAgICAgICAgIGVudHJ5OiBcInNyYy9pbmRleC50c1wiLFxuICAgICAgICAgICAgbmFtZTogXCJXU1hSb3V0ZXJcIixcbiAgICAgICAgICAgIGZvcm1hdHM6IFtcImVzXCIsIFwiY2pzXCJdLFxuICAgICAgICAgICAgZmlsZU5hbWU6IChmb3JtYXQpID0+IGBpbmRleC4ke2Zvcm1hdCA9PT0gXCJlc1wiID8gXCJqc1wiIDogXCJjanNcIn1gLFxuICAgICAgICB9LFxuICAgICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgICAgICBleHRlcm5hbDogW1wiQHdzeGpzL3dzeC1jb3JlXCJdLFxuICAgICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICAgICAgZ2xvYmFsczoge1xuICAgICAgICAgICAgICAgICAgICBcIkB3c3hqcy93c3gtY29yZVwiOiBcIldTWENvcmVcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgY3NzQ29kZVNwbGl0OiBmYWxzZSwgLy8gXHU3OTgxXHU3NTI4Q1NTXHU0RUUzXHU3ODAxXHU1MjA2XHU1MjcyXHVGRjBDXHU3ODZFXHU0RkREQ1NTXHU1MTg1XHU4MDU0XHU1MjMwSlNcdTRFMkRcbiAgICAgICAgc291cmNlbWFwOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJkZXZlbG9wbWVudFwiLCAvLyBcdTUzRUFcdTU3MjhcdTVGMDBcdTUzRDFcdTczQUZcdTU4ODNcdTc1MUZcdTYyMTAgc291cmNlIG1hcHNcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgd3N4KHtcbiAgICAgICAgICAgIGRlYnVnOiBmYWxzZSxcbiAgICAgICAgICAgIGpzeEZhY3Rvcnk6IFwianN4XCIsXG4gICAgICAgICAgICBqc3hGcmFnbWVudDogXCJGcmFnbWVudFwiLFxuICAgICAgICB9KSxcbiAgICBdLFxuICAgIC8vIFJlc29sdmUgd29ya3NwYWNlIHBhY2thZ2VzIHRvIHNvdXJjZSBmaWxlcyBpbiBkZXZlbG9wbWVudCBtb2RlXG4gICAgLy8gSW4gcHJvZHVjdGlvbiwgVml0ZSB3aWxsIHVzZSBwYWNrYWdlLmpzb24gZXhwb3J0cyAoZGlzdCBmaWxlcylcbiAgICByZXNvbHZlOiB7XG4gICAgICAgIGFsaWFzOlxuICAgICAgICAgICAgcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIlxuICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgIFwiQHdzeGpzL3dzeC1jb3JlXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi4vY29yZS9zcmMvaW5kZXgudHNcIiksXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErVCxTQUFTLG9CQUFvQjtBQUM1VixTQUFTLFdBQVc7QUFDcEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBSHdLLElBQU0sMkNBQTJDO0FBS3ZQLElBQU0sWUFBWSxLQUFLLFFBQVEsY0FBYyx3Q0FBZSxDQUFDO0FBRTdELElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLE9BQU87QUFBQSxJQUNILEtBQUs7QUFBQSxNQUNELE9BQU87QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLFNBQVMsQ0FBQyxNQUFNLEtBQUs7QUFBQSxNQUNyQixVQUFVLENBQUMsV0FBVyxTQUFTLFdBQVcsT0FBTyxPQUFPLEtBQUs7QUFBQSxJQUNqRTtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ1gsVUFBVSxDQUFDLGlCQUFpQjtBQUFBLE1BQzVCLFFBQVE7QUFBQSxRQUNKLFNBQVM7QUFBQSxVQUNMLG1CQUFtQjtBQUFBLFFBQ3ZCO0FBQUEsTUFDSjtBQUFBLElBQ0o7QUFBQSxJQUNBLGNBQWM7QUFBQTtBQUFBLElBQ2QsV0FBVyxRQUFRLElBQUksYUFBYTtBQUFBO0FBQUEsRUFDeEM7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLElBQUk7QUFBQSxNQUNBLE9BQU87QUFBQSxNQUNQLFlBQVk7QUFBQSxNQUNaLGFBQWE7QUFBQSxJQUNqQixDQUFDO0FBQUEsRUFDTDtBQUFBO0FBQUE7QUFBQSxFQUdBLFNBQVM7QUFBQSxJQUNMLE9BQ0ksUUFBUSxJQUFJLGFBQWEsZ0JBQ25CO0FBQUEsTUFDSSxtQkFBbUIsS0FBSyxRQUFRLFdBQVcsc0JBQXNCO0FBQUEsSUFDckUsSUFDQTtBQUFBLEVBQ2Q7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
