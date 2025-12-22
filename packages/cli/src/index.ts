#!/usr/bin/env node

import { Command } from "commander";
import { initWSX } from "./commands/init.js";
import { checkConfig, displayCheckResults } from "./commands/check-config.js";

const program = new Command();

program.name("wsx").description("WSXJS CLI tool").version("0.0.17");

program
    .command("init")
    .description("Initialize WSXJS in your project")
    .option("--skip-tsconfig", "Skip TypeScript configuration")
    .option("--skip-vite", "Skip Vite configuration")
    .option("--skip-eslint", "Skip ESLint configuration")
    .option("--skip-types", "Skip wsx.d.ts generation")
    .option("--use-tsconfig-package", "Use @wsxjs/wsx-tsconfig package")
    .option("--use-decorators", "Enable decorator support (@state)")
    .option("--no-interactive", "Skip interactive prompts")
    .action(async (options) => {
        await initWSX(options);
    });

program
    .command("check")
    .description("Check WSX configuration")
    .action(async () => {
        const result = await checkConfig();
        await displayCheckResults(result);
    });

program.parse();
