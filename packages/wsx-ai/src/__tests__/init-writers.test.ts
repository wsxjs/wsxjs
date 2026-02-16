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
        it("creates .claude/skills/wsx-apply/SKILL.md", () => {
            const dir = makeTempDir();
            const { path: outPath } = writeForClaude(dir);
            expect(outPath).toContain(".claude");
            expect(outPath).toContain("wsx-apply");
            expect(outPath.endsWith("SKILL.md")).toBe(true);
            const content = readFileSync(outPath, "utf8");
            expect(content).toContain("wsx-apply");
            expect(content).toContain("@wsxjs/wsx-ai");
        });
    });

    describe("writeForCursor", () => {
        it("creates .cursor/commands/wsx-ai-apply.md", () => {
            const dir = makeTempDir();
            const { path: outPath } = writeForCursor(dir);
            expect(outPath).toContain(".cursor");
            expect(outPath).toContain("commands");
            expect(outPath.endsWith("wsx-ai-apply.md")).toBe(true);
            const content = readFileSync(outPath, "utf8");
            expect(content).toContain("wsx-ai apply");
            expect(content).toContain("applyAll");
        });
    });

    describe("writeForAntigravity", () => {
        it("creates .antigravity/wsx-apply.md", () => {
            const dir = makeTempDir();
            const { path: outPath } = writeForAntigravity(dir);
            expect(outPath).toContain(".antigravity");
            expect(outPath.endsWith("wsx-apply.md")).toBe(true);
            const content = readFileSync(outPath, "utf8");
            expect(content).toContain("wsx-apply");
            expect(content).toContain("@wsxjs/wsx-ai");
        });
    });

    describe("writeFor", () => {
        it("writes for each AI target", () => {
            const dir = makeTempDir();
            for (const target of AI_TARGETS) {
                const { path: outPath } = writeFor(dir, target);
                expect(existsSync(outPath)).toBe(true);
                expect(readFileSync(outPath, "utf8").length).toBeGreaterThan(0);
            }
        });
        it("throws for unknown target", () => {
            const dir = makeTempDir();
            expect(() => writeFor(dir, "unknown" as "claude")).toThrow("Unknown AI target");
        });
    });
});
