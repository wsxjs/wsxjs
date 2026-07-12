#!/usr/bin/env node
/**
 * wsx-ai CLI: init — add all WSX skills (press, theme, components, site) for Claude, Cursor, Antigravity
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
    .description(
        "Add all WSX skills (apply + press, theme, components, site) for the chosen AI(s). Default: all AIs."
    )
    .option("-a, --ai <target>", "AI: claude | cursor | antigravity | all")
    .option("--all, --all-ais", "Add all skills to all AIs (Claude + Cursor + Antigravity)")
    .option("--claude", "Add all skills for Claude only")
    .option("--cursor", "Add all skills for Cursor only")
    .option("--antigravity", "Add all skills for Antigravity only")
    .option("-c, --cwd <dir>", "Project directory (default: cwd)", process.cwd())
    .action(
        (options: {
            ai?: string;
            all?: boolean;
            allAis?: boolean;
            claude?: boolean;
            cursor?: boolean;
            antigravity?: boolean;
            cwd: string;
        }) => {
            const cwd = resolve(options.cwd);
            // Prefer explicit flags, then --ai <target>. --all or --all-ais => all AIs
            let raw: string;
            if (options.all || options.allAis) raw = "all";
            else if (options.claude) raw = "claude";
            else if (options.cursor) raw = "cursor";
            else if (options.antigravity) raw = "antigravity";
            else raw = (options.ai ?? "all").toLowerCase();

            const targets: AITarget[] = raw === "all" ? [...AI_TARGETS] : [raw as AITarget];

            if (targets.some((t) => !AI_TARGETS.includes(t))) {
                console.error(
                    "Invalid target. Use: --ai claude | cursor | antigravity | all, or --all | --all-ais | --claude | --cursor | --antigravity"
                );
                process.exit(1);
            }

            const written: { target: string; path: string }[] = [];
            for (const target of targets) {
                const results = writeFor(cwd, target);
                for (const { path } of results) {
                    written.push({ target, path });
                }
            }

            console.info(
                "wsx-ai init: added all skills (apply + press, theme, components, site) for:"
            );
            written.forEach(({ target, path }) => console.info(`  - ${target}: ${path}`));
        }
    );

program.parse();
