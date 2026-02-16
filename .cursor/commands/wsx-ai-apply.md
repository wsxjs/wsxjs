# wsx-ai apply

When the user asks to add **wsx-press**, **wsx-theme**, **wsx-branding**, **base components**, or **router/site** to a WSXJS project, use `@wsxjs/wsx-ai` and apply the right skill.

## Usage

```ts
import { applyAll, applySkill } from "@wsxjs/wsx-ai";

// Apply one: "press" | "theme" | "components" | "site"
const out = applySkill("theme");

// Apply all four (1 press, 2 theme, 3 components, 4 site)
const out = applyAll();
```

Then use `out.packageJsonAdditions`, `out.viteConfigSnippet`, `out.codeSnippets`, `out.instructions` to update the project.
