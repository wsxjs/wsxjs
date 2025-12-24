/**
 * WSXJS Examples - Main Entry Point
 *
 * This demonstrates how to use WSXJS to build a complete application.
 * The App component showcases all framework features and example components.
 */

import { createLogger } from "@wsxjs/wsx-core";
import "uno.css";
import "./main.css";
// Import base components package (includes CSS)
import "@wsxjs/wsx-base-components";
// Initialize i18next
import "./i18n";
// Initialize error handler
import { ErrorHandler } from "./utils/error-handler";
import "./App.wsx";

const logger = createLogger("Main");

// Initialize the application
function initApp() {
    // 初始化全局错误处理
    ErrorHandler.init();

    const appContainer = document.getElementById("app");

    if (!appContainer) {
        logger.error("App container not found");
        return;
    }

    // Mount the WSX App component
    const appElement = document.createElement("wsx-app");
    appContainer.appendChild(appElement);

    logger.info("WSXJS Example App initialized");
}

// Start the app when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
