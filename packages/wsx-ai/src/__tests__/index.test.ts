import { describe, it, expect } from "vitest";
import {
    applyPress,
    applyTheme,
    applyComponents,
    applySite,
    applySkill,
    applyAll,
    SKILL_NAMES,
} from "../index";

function assertApplyResult(result: {
    packageJsonAdditions: Record<string, string>;
    instructions: string[];
}) {
    expect(result).toBeDefined();
    expect(typeof result.packageJsonAdditions).toBe("object");
    expect(Array.isArray(result.instructions)).toBe(true);
    expect(result.instructions.length).toBeGreaterThan(0);
}

describe("applyPress", () => {
    it("returns packageJsonAdditions with @wsxjs/wsx-press", () => {
        const out = applyPress();
        assertApplyResult(out);
        expect(out.packageJsonAdditions["@wsxjs/wsx-press"]).toBe("workspace:*");
        expect(out.viteConfigSnippet).toBeDefined();
    });
});

describe("applyTheme", () => {
    it("returns packageJsonAdditions with @wsxjs/wsx-theme", () => {
        const out = applyTheme();
        assertApplyResult(out);
        expect(out.packageJsonAdditions["@wsxjs/wsx-theme"]).toBe("workspace:*");
        expect(out.codeSnippets?.["root-wrapper"]).toBeDefined();
    });
});

describe("applyComponents", () => {
    it("returns packageJsonAdditions with @wsxjs/wsx-base-components", () => {
        const out = applyComponents();
        assertApplyResult(out);
        expect(out.packageJsonAdditions["@wsxjs/wsx-base-components"]).toBe("workspace:*");
        expect(out.codeSnippets?.usage).toBeDefined();
    });
});

describe("applySite", () => {
    it("returns packageJsonAdditions with @wsxjs/wsx-router", () => {
        const out = applySite();
        assertApplyResult(out);
        expect(out.packageJsonAdditions["@wsxjs/wsx-router"]).toBe("workspace:*");
        expect(out.codeSnippets?.router).toBeDefined();
        expect(out.viteConfigSnippet).toBeDefined();
    });
});

describe("applySkill", () => {
    it("returns same as applyPress for press", () => {
        const out = applySkill("press");
        expect(out.packageJsonAdditions["@wsxjs/wsx-press"]).toBe("workspace:*");
    });
    it("returns same as applyTheme for theme", () => {
        const out = applySkill("theme");
        expect(out.packageJsonAdditions["@wsxjs/wsx-theme"]).toBe("workspace:*");
    });
    it("returns same as applyComponents for components", () => {
        const out = applySkill("components");
        expect(out.packageJsonAdditions["@wsxjs/wsx-base-components"]).toBe("workspace:*");
    });
    it("returns same as applySite for site", () => {
        const out = applySkill("site");
        expect(out.packageJsonAdditions["@wsxjs/wsx-router"]).toBe("workspace:*");
    });
    it("throws for unknown skill", () => {
        expect(() => applySkill("unknown" as "press")).toThrow("Unknown skill");
    });
});

describe("applyAll", () => {
    it("merges all four skills", () => {
        const out = applyAll();
        expect(out.packageJsonAdditions["@wsxjs/wsx-press"]).toBe("workspace:*");
        expect(out.packageJsonAdditions["@wsxjs/wsx-theme"]).toBe("workspace:*");
        expect(out.packageJsonAdditions["@wsxjs/wsx-base-components"]).toBe("workspace:*");
        expect(out.packageJsonAdditions["@wsxjs/wsx-router"]).toBe("workspace:*");
        expect(out.instructions).toContain("=== 1. Press ===");
        expect(out.instructions).toContain("=== 2. Theme ===");
        expect(out.instructions).toContain("=== 3. Components ===");
        expect(out.instructions).toContain("=== 4. Site (Router) ===");
        expect(out.viteConfigSnippet).toBeDefined();
        expect(out.codeSnippets?.["root-wrapper"]).toBeDefined();
        expect(out.codeSnippets?.router).toBeDefined();
    });
});

describe("SKILL_NAMES", () => {
    it("has four skills", () => {
        expect(SKILL_NAMES).toEqual(["press", "theme", "components", "site"]);
    });
});
