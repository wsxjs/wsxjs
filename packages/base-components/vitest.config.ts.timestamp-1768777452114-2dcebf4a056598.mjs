// vitest.config.ts
import { defineConfig } from "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/node_modules/.pnpm/vitest@2.1.9_@types+node@22.19.3_@vitest+ui@2.1.9_happy-dom@18.0.1_jsdom@26.1.0/node_modules/vitest/dist/config.js";
import { wsx } from "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/packages/vite-plugin/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Volumes/ORICO/ws/prj/wsx/wsxjs/packages/base-components/vitest.config.ts";
var vitest_config_default = defineConfig({
  plugins: [
    wsx({
      debug: false,
      jsxFactory: "h",
      jsxFragment: "Fragment"
    })
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
    include: ["src/**/*.{test,spec}.{js,ts,wsx}", "src/__tests__/**/*.{js,ts,wsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.{ts,wsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,wsx}",
        "src/__tests__/**/*",
        "src/index.ts",
        "src/jsx-inject.ts",
        "src/types/**/*",
        "src/**/*.types.ts"
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100
      }
    }
  },
  resolve: {
    alias: {
      "@wsxjs/wsx-core": new URL("../core/src", __vite_injected_original_import_meta_url).pathname
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Wb2x1bWVzL09SSUNPL3dzL3Byai93c3gvd3N4anMvcGFja2FnZXMvYmFzZS1jb21wb25lbnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVm9sdW1lcy9PUklDTy93cy9wcmovd3N4L3dzeGpzL3BhY2thZ2VzL2Jhc2UtY29tcG9uZW50cy92aXRlc3QuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Wb2x1bWVzL09SSUNPL3dzL3Byai93c3gvd3N4anMvcGFja2FnZXMvYmFzZS1jb21wb25lbnRzL3ZpdGVzdC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZXN0L2NvbmZpZ1wiO1xuaW1wb3J0IHsgd3N4IH0gZnJvbSBcIkB3c3hqcy93c3gtdml0ZS1wbHVnaW5cIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICAgIHdzeCh7XG4gICAgICAgICAgICBkZWJ1ZzogZmFsc2UsXG4gICAgICAgICAgICBqc3hGYWN0b3J5OiBcImhcIixcbiAgICAgICAgICAgIGpzeEZyYWdtZW50OiBcIkZyYWdtZW50XCIsXG4gICAgICAgIH0pLFxuICAgIF0sXG4gICAgdGVzdDoge1xuICAgICAgICBlbnZpcm9ubWVudDogXCJqc2RvbVwiLFxuICAgICAgICBnbG9iYWxzOiB0cnVlLFxuICAgICAgICBzZXR1cEZpbGVzOiBbXSxcbiAgICAgICAgaW5jbHVkZTogW1wic3JjLyoqLyoue3Rlc3Qsc3BlY30ue2pzLHRzLHdzeH1cIiwgXCJzcmMvX190ZXN0c19fLyoqLyoue2pzLHRzLHdzeH1cIl0sXG4gICAgICAgIGNvdmVyYWdlOiB7XG4gICAgICAgICAgICBwcm92aWRlcjogXCJ2OFwiLFxuICAgICAgICAgICAgcmVwb3J0ZXI6IFtcInRleHRcIiwgXCJqc29uXCIsIFwiaHRtbFwiLCBcImxjb3ZcIl0sXG4gICAgICAgICAgICBpbmNsdWRlOiBbXCJzcmMvKiovKi57dHMsd3N4fVwiXSxcbiAgICAgICAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgICAgICAgICBcInNyYy8qKi8qLnt0ZXN0LHNwZWN9Lnt0cyx3c3h9XCIsXG4gICAgICAgICAgICAgICAgXCJzcmMvX190ZXN0c19fLyoqLypcIixcbiAgICAgICAgICAgICAgICBcInNyYy9pbmRleC50c1wiLFxuICAgICAgICAgICAgICAgIFwic3JjL2pzeC1pbmplY3QudHNcIixcbiAgICAgICAgICAgICAgICBcInNyYy90eXBlcy8qKi8qXCIsXG4gICAgICAgICAgICAgICAgXCJzcmMvKiovKi50eXBlcy50c1wiLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHRocmVzaG9sZHM6IHtcbiAgICAgICAgICAgICAgICBsaW5lczogMTAwLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uczogMTAwLFxuICAgICAgICAgICAgICAgIGJyYW5jaGVzOiAxMDAsXG4gICAgICAgICAgICAgICAgc3RhdGVtZW50czogMTAwLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHJlc29sdmU6IHtcbiAgICAgICAgYWxpYXM6IHtcbiAgICAgICAgICAgIFwiQHdzeGpzL3dzeC1jb3JlXCI6IG5ldyBVUkwoXCIuLi9jb3JlL3NyY1wiLCBpbXBvcnQubWV0YS51cmwpLnBhdGhuYW1lLFxuICAgICAgICB9LFxuICAgIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFYsU0FBUyxvQkFBb0I7QUFDM1gsU0FBUyxXQUFXO0FBRHNNLElBQU0sMkNBQTJDO0FBRzNRLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQ3hCLFNBQVM7QUFBQSxJQUNMLElBQUk7QUFBQSxNQUNBLE9BQU87QUFBQSxNQUNQLFlBQVk7QUFBQSxNQUNaLGFBQWE7QUFBQSxJQUNqQixDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0YsYUFBYTtBQUFBLElBQ2IsU0FBUztBQUFBLElBQ1QsWUFBWSxDQUFDO0FBQUEsSUFDYixTQUFTLENBQUMsb0NBQW9DLGdDQUFnQztBQUFBLElBQzlFLFVBQVU7QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLFFBQVEsUUFBUSxNQUFNO0FBQUEsTUFDekMsU0FBUyxDQUFDLG1CQUFtQjtBQUFBLE1BQzdCLFNBQVM7QUFBQSxRQUNMO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNKO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDUixPQUFPO0FBQUEsUUFDUCxXQUFXO0FBQUEsUUFDWCxVQUFVO0FBQUEsUUFDVixZQUFZO0FBQUEsTUFDaEI7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ0wsT0FBTztBQUFBLE1BQ0gsbUJBQW1CLElBQUksSUFBSSxlQUFlLHdDQUFlLEVBQUU7QUFBQSxJQUMvRDtBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
