import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
    writeForClaude,
    writeForCursor,
    writeForAntigravity,
    writeFor,
    AI_TARGETS,
} from "../init-writers";

describe("init-writers", () => {
    let cwd: string;

    afterEach(() => {
        if (cwd && existsSync(cwd)) rmSync(cwd, { recursive: true });
    });

    function makeTempDir(): string {
        cwd = mkdtempSync(join(tmpdir(), "wsx-ai-test-"));
        return cwd;
    }

    describe("writeForClaude", () => {
        it("creates .claude/skills/wsx-apply and per-skill SKILL.md", () => {
            const dir = makeTempDir();
            const results = writeForClaude(dir);
            expect(results.length).toBeGreaterThanOrEqual(5); // 1 combined + 4 skills
            const applyPath = results.find((r) => r.path.includes("/wsx-apply/SKILL.md"));
            expect(applyPath).toBeDefined();
            const content = readFileSync(applyPath!.path, "utf8");
            expect(content).toContain("wsx-apply");
            expect(content).toContain("@wsxjs/wsx-ai");
            const pressPath = results.find((r) => r.path.includes("wsx-apply-press"));
            expect(pressPath).toBeDefined();
            expect(readFileSync(pressPath!.path, "utf8")).toContain('applySkill("press")');
        });
    });

    describe("writeForCursor", () => {
        it("creates .cursor/commands/wsx-ai-apply and per-skill commands", () => {
            const dir = makeTempDir();
            const results = writeForCursor(dir);
            expect(results.length).toBe(5); // 1 combined + 4 skills
            const applyPath = results.find((r) => r.path.endsWith("wsx-ai-apply.md"));
            expect(applyPath).toBeDefined();
            const content = readFileSync(applyPath!.path, "utf8");
            expect(content).toContain("wsx-ai apply");
            expect(content).toContain("applyAll");
            const pressPath = results.find((r) => r.path.endsWith("wsx-ai-press.md"));
            expect(pressPath).toBeDefined();
            expect(readFileSync(pressPath!.path, "utf8")).toContain('applySkill("press")');
        });
    });

    describe("writeForAntigravity", () => {
        it("creates .antigravity/wsx-apply and per-skill md", () => {
            const dir = makeTempDir();
            const results = writeForAntigravity(dir);
            expect(results.length).toBeGreaterThanOrEqual(5);
            const applyPath = results.find((r) => r.path.endsWith("wsx-apply.md"));
            expect(applyPath).toBeDefined();
            const content = readFileSync(applyPath!.path, "utf8");
            expect(content).toContain("wsx-apply");
            expect(content).toContain("@wsxjs/wsx-ai");
            const pressPath = results.find((r) => r.path.endsWith("wsx-apply-press.md"));
            expect(pressPath).toBeDefined();
        });
    });

    describe("writeFor", () => {
        it("writes for each AI target (multiple files per target)", () => {
            const dir = makeTempDir();
            for (const target of AI_TARGETS) {
                const results = writeFor(dir, target);
                expect(Array.isArray(results)).toBe(true);
                expect(results.length).toBeGreaterThanOrEqual(1);
                for (const { path: outPath } of results) {
                    expect(existsSync(outPath)).toBe(true);
                    expect(readFileSync(outPath, "utf8").length).toBeGreaterThan(0);
                }
            }
        });
        it("throws for unknown target", () => {
            const dir = makeTempDir();
            expect(() => writeFor(dir, "unknown" as "claude")).toThrow("Unknown AI target");
        });
    });
});
