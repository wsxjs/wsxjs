#!/usr/bin/env node
/**
 * wsx-ai CLI: init — add WSX apply skill for Claude, Cursor, Antigravity
 */
import { Command } from "commander";
import { resolve } from "path";
import { AI_TARGETS, writeFor, type AITarget } from "./init-writers.js";

const program = new Command();

program
    .name("wsx-ai")
    .description("Apply WSXJS skills (press, theme, components, site) and add AI config")
    .version("0.1.0");

program
    .command("init")
    .description("Add WSX apply skill for the given AI (Claude, Cursor, Antigravity)")
    .option("-a, --ai <target>", "AI to configure: claude | cursor | antigravity", "all")
    .option("-c, --cwd <dir>", "Project directory (default: cwd)", process.cwd())
    .action((options: { ai: string; cwd: string }) => {
        const cwd = resolve(options.cwd);
        const raw = options.ai.toLowerCase();
        const targets: AITarget[] = raw === "all" ? [...AI_TARGETS] : [raw as AITarget];

        if (targets.some((t) => !AI_TARGETS.includes(t))) {
            console.error("Invalid --ai. Use: claude | cursor | antigravity | all");
            process.exit(1);
        }

        const written: { target: string; path: string }[] = [];
        for (const target of targets) {
            const { path } = writeFor(cwd, target);
            written.push({ target, path });
        }

        console.info("wsx-ai init: added WSX apply skill for:");
        written.forEach(({ target, path }) => console.info(`  - ${target}: ${path}`));
    });

program.parse();
