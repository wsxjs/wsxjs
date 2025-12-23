#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * Chrome调试脚本 - WSXJS
 *
 * 用于调试WSXJS应用的Chrome DevTools集成
 */

import { spawn } from "child_process";

// Chrome启动参数
const CHROME_ARGS = [
    "--remote-debugging-port=9222",
    "--disable-web-security",
    "--disable-features=VizDisplayCompositor",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-default-apps",
    "--disable-popup-blocking",
    "--disable-translate",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-field-trial-config",
    "--disable-ipc-flooding-protection",
    "--enable-logging",
    "--log-level=0",
    "--v=1",
];

// 启动Chrome
function startChrome() {
    console.log("🚀 启动Chrome调试模式...");

    const chromePath =
        process.platform === "darwin"
            ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            : process.platform === "win32"
              ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
              : "google-chrome";

    const chrome = spawn(chromePath, CHROME_ARGS, {
        stdio: "inherit",
        detached: true,
    });

    chrome.on("error", (err) => {
        console.error("❌ Chrome启动失败:", err.message);
        process.exit(1);
    });

    chrome.on("spawn", () => {
        console.log("✅ Chrome已启动，调试端口: 9222");
        console.log("🌐 访问 http://localhost:9222 查看调试页面");
        console.log("🔗 在Chrome中访问 http://localhost:5173 查看WSX应用");
        console.log("📝 按 Ctrl+C 停止调试");
    });

    return chrome;
}

// 主函数
function main() {
    const chrome = startChrome();

    // 处理退出信号
    process.on("SIGINT", () => {
        console.log("\n🛑 停止Chrome调试...");
        chrome.kill("SIGTERM");
        process.exit(0);
    });

    process.on("SIGTERM", () => {
        console.log("\n🛑 停止Chrome调试...");
        chrome.kill("SIGTERM");
        process.exit(0);
    });
}

// 运行脚本
main();
