# AI Agent Guide: Building a Website with WSXJS

Quick reference for AI agents building complete websites using WSXJS, based on the official WSXJS site implementation.

## Project Structure

```
site/
├── index.html              # Entry HTML file
├── vite.config.ts          # Vite configuration
├── package.json            # Dependencies
├── public/                 # Static assets
│   ├── locales/           # i18n translation files
│   └── docs/              # Documentation markdown files (if using wsx-press)
├── src/
│   ├── main.ts            # Application entry point
│   ├── main.css           # Global styles and CSS variables
│   ├── i18n.ts            # i18next initialization
│   ├── App.wsx            # Main app component (LightComponent)
│   ├── components/        # Page section components
│   │   ├── HomeSection.wsx
│   │   ├── FeaturesSection.wsx
│   │   └── ...
│   ├── config/
│   │   └── route-meta.ts  # SEO meta configuration
│   └── utils/
│       ├── meta-manager.ts    # Dynamic meta tag management
│       └── error-handler.ts   # Global error handling
```

## Core Setup

### 1. Entry Point (`index.html`)

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your Site Title</title>
        <!-- Favicon -->
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <!-- SEO Meta Tags (will be updated dynamically) -->
        <meta name="description" content="Your site description" />
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            #app {
                min-height: 100vh;
            }
        </style>
    </head>
    <body>
        <div id="app"></div>
        <script type="module" src="/src/main.ts"></script>
    </body>
</html>
```

### 2. Main Entry (`src/main.ts`)

```typescript
import "./main.css";
// Import base components package (includes CSS)
import "@wsxjs/wsx-base-components";
// Initialize i18next
import "./i18n";
// Initialize error handler
import { ErrorHandler } from "./utils/error-handler";
// Import main app component
import "./App.wsx";

// Initialize the application
function initApp() {
    // Initialize global error handling
    ErrorHandler.init();

    const appContainer = document.getElementById("app");
    if (!appContainer) {
        console.error("App container not found");
        return;
    }

    // Mount the WSX App component
    const appElement = document.createElement("wsx-app");
    appContainer.appendChild(appElement);
}

// Start the app when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
```

### 3. Vite Configuration (`vite.config.ts`)

```typescript
import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        wsx({
            debug: false,
            jsxFactory: "h",
            jsxFragment: "Fragment",
        }),
    ],
    build: {
        outDir: "dist",
        cssCodeSplit: false, // ✅ REQUIRED for Shadow DOM
        sourcemap: process.env.NODE_ENV !== "production",
    },
    resolve: {
        alias: [
            {
                find: "@wsxjs/wsx-core",
                replacement: path.resolve(__dirname, "../packages/core/src/index.ts"),
            },
            // Add other workspace aliases as needed
        ],
    },
});
```

### 4. Global Styles (`src/main.css`)

```css
/* CSS Variables - Theme Colors */
:root {
    /* Primary theme colors */
    --primary-red: #dc2626;
    --accent-orange: #ea580c;
    
    /* Light mode */
    --text-primary: #2c3e50;
    --text-secondary: #7f8c8d;
    --bg-primary: #fef2e5;
    --bg-secondary: #fde8d1;
    --border-color: #fed7aa;
    
    /* Layout */
    --nav-height: 70px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
    :root {
        --text-primary: #ffffff;
        --text-secondary: #b0b0b0;
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --border-color: #404040;
    }
}

/* Global styles */
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
}
```

### 5. i18n Setup (`src/i18n.ts`)

```typescript
import { initI18n, i18nInstance } from "@wsxjs/wsx-i18next";

export const i18n = initI18n({
    fallbackLng: "en",
    debug: false,
    backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    ns: ["common", "home", "features"], // Add your namespaces
    defaultNS: "common",
});

export { i18nInstance };
```

## Main App Component

### App Component (`src/App.wsx`)

**CRITICAL**: The main app component **MUST** extend `LightComponent` (not `WebComponent`) because:
- Routing requires Light DOM access
- Navigation needs to work with global DOM
- Container components use Light DOM (RFC-0006)

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
import { LightComponent, autoRegister } from "@wsxjs/wsx-core";
import { i18n } from "@wsxjs/wsx-i18next";
import styles from "./App.css?inline";
// Import base components and router
import "@wsxjs/wsx-base-components";
import "@wsxjs/wsx-router";
import { RouterUtils } from "@wsxjs/wsx-router";
// Import SEO utilities
import { MetaManager, type RouteMeta } from "./utils/meta-manager";
import { getRouteMeta } from "./config/route-meta";
// Import section components
import "./components/HomeSection.wsx";
import "./components/FeaturesSection.wsx";
import "./components/NotFoundSection.wsx";

@autoRegister({ tagName: "wsx-app" })
@i18n("common")
export default class App extends LightComponent {
    constructor() {
        super({
            styles,
            styleName: "wsx-app",
        });
    }

    protected onConnected(): void {
        super.onConnected();
        
        // Listen for route changes to update SEO meta
        RouterUtils.onRouteChange(() => {
            this.updateRouteMeta();
        });
        
        // Update meta for initial route
        this.updateRouteMeta();
    }

    /**
     * Update SEO meta tags when route changes
     */
    private updateRouteMeta(): void {
        const routeInfo = RouterUtils.getCurrentRoute();
        const meta = getRouteMeta(routeInfo.path);
        MetaManager.update(meta);
        
        // Add structured data if needed
        const structuredData = this.getStructuredData(routeInfo.path, meta);
        MetaManager.setStructuredData(structuredData);
    }

    /**
     * Generate structured data (JSON-LD) for SEO
     */
    private getStructuredData(path: string, meta: RouteMeta): Record<string, unknown> {
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: meta.title,
            description: meta.description,
            url: `https://yoursite.com${path}`,
        };
    }

    /**
     * Render navigation
     */
    private renderNavigation() {
        return (
            <nav class="main-nav">
                <wsx-link to="/" class="nav-brand">Your Site</wsx-link>
                <div class="nav-links">
                    <wsx-link to="/">Home</wsx-link>
                    <wsx-link to="/features">Features</wsx-link>
                    <wsx-link to="/about">About</wsx-link>
                </div>
            </nav>
        );
    }

    render() {
        return (
            <div class="app-container">
                {/* Navigation */}
                {this.renderNavigation()}
                
                {/* Main Content */}
                <div class="app-content">
                    {/* Router Container */}
                    <wsx-router>
                        <wsx-view route="/" component="home-section"></wsx-view>
                        <wsx-view route="/features" component="features-section"></wsx-view>
                        <wsx-view route="/about" component="about-section"></wsx-view>
                        {/* 404 fallback */}
                        <wsx-view route="*" component="not-found-section"></wsx-view>
                    </wsx-router>
                </div>
                
                {/* Footer */}
                <footer class="app-footer">
                    <p>&copy; 2024 Your Site</p>
                </footer>
            </div>
        );
    }
}
```

## Page Section Components

### Section Component Pattern

Each route corresponds to a **section component** that extends `WebComponent` (Shadow DOM) for style isolation:

```tsx
/** @jsxImportSource @wsxjs/wsx-core */
import { WebComponent, autoRegister } from "@wsxjs/wsx-core";
import { i18n } from "@wsxjs/wsx-i18next";
import styles from "./HomeSection.css?inline";
import "@wsxjs/wsx-base-components";

@autoRegister({ tagName: "home-section" })
@i18n("home")
export default class HomeSection extends WebComponent {
    constructor() {
        super({ styles });
    }

    render() {
        return (
            <div class="home-section">
                <section class="hero">
                    <h1>{this.t("hero.title")}</h1>
                    <p>{this.t("hero.description")}</p>
                    <wsx-link to="/features" class="btn-primary">
                        {this.t("hero.getStarted")}
                    </wsx-link>
                </section>
            </div>
        );
    }
}
```

**Key Points**:
- ✅ Use `WebComponent` (Shadow DOM) for page sections
- ✅ Use `@i18n("namespace")` decorator for translations
- ✅ Use `this.t("key")` to access translations
- ✅ Import base components: `import "@wsxjs/wsx-base-components"`
- ✅ Use `wsx-link` for navigation (from `@wsxjs/wsx-router`)

## Routing

### Route Configuration

```tsx
<wsx-router>
    {/* Exact match routes */}
    <wsx-view route="/" component="home-section"></wsx-view>
    <wsx-view route="/features" component="features-section"></wsx-view>
    
    {/* Parameter routes */}
    <wsx-view route="/blog/:slug" component="blog-post-section"></wsx-view>
    
    {/* Prefix match (for nested routes) */}
    <wsx-view route="/docs/*" component="doc-section"></wsx-view>
    
    {/* Wildcard (404 fallback) - MUST be last */}
    <wsx-view route="*" component="not-found-section"></wsx-view>
</wsx-router>
```

### Route Change Handling

```tsx
import { RouterUtils } from "@wsxjs/wsx-router";

protected onConnected(): void {
    super.onConnected();
    
    // Listen for route changes
    RouterUtils.onRouteChange(() => {
        const routeInfo = RouterUtils.getCurrentRoute();
        console.log("Route changed:", routeInfo.path);
        console.log("Params:", routeInfo.params);
        
        // Update meta tags
        this.updateRouteMeta();
    });
}
```

## SEO Management

### Meta Manager (`src/utils/meta-manager.ts`)

```typescript
export interface RouteMeta {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    url?: string;
}

export class MetaManager {
    private static readonly BASE_URL = "https://yoursite.com";
    private static readonly DEFAULT_IMAGE = "/og-image.png";

    static update(meta: RouteMeta): void {
        // Update title
        document.title = meta.title;

        // Update meta tags
        this.setMeta("description", meta.description);
        if (meta.keywords) {
            this.setMeta("keywords", meta.keywords);
        }

        // Update Open Graph
        this.setOGMeta("og:title", meta.title);
        this.setOGMeta("og:description", meta.description);
        this.setOGMeta("og:url", meta.url || this.getCurrentUrl());
        this.setOGMeta("og:image", meta.image || this.getFullUrl(this.DEFAULT_IMAGE));

        // Update Twitter Card
        this.setMeta("twitter:card", "summary_large_image");
        this.setMeta("twitter:title", meta.title);
        this.setMeta("twitter:description", meta.description);
    }

    private static setMeta(name: string, content: string): void {
        let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
        if (!element) {
            element = document.createElement("meta");
            element.setAttribute("name", name);
            document.head.appendChild(element);
        }
        element.setAttribute("content", content);
    }

    private static setOGMeta(property: string, content: string): void {
        let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!element) {
            element = document.createElement("meta");
            element.setAttribute("property", property);
            document.head.appendChild(element);
        }
        element.setAttribute("content", content);
    }

    static setStructuredData(data: Record<string, unknown>): void {
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
            existingScript.remove();
        }
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
    }

    private static getCurrentUrl(): string {
        return this.BASE_URL + window.location.pathname;
    }

    private static getFullUrl(path: string): string {
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        return this.BASE_URL + (path.startsWith("/") ? path : "/" + path);
    }
}
```

### Route Meta Configuration (`src/config/route-meta.ts`)

```typescript
import type { RouteMeta } from "../utils/meta-manager";

export const routeMeta: Record<string, RouteMeta> = {
    "/": {
        title: "Your Site - Home",
        description: "Your site description",
        keywords: "your, keywords",
        image: "/og-image.png",
    },
    "/features": {
        title: "Features - Your Site",
        description: "Discover our features",
        keywords: "features",
        image: "/og-image.png",
    },
    "*": {
        title: "404 - Page Not Found | Your Site",
        description: "The page you're looking for doesn't exist.",
        image: "/og-image.png",
    },
};

export function getRouteMeta(path: string): RouteMeta {
    if (routeMeta[path]) {
        return routeMeta[path];
    }
    // Handle dynamic routes (e.g., /blog/:slug)
    if (path.startsWith("/blog/")) {
        return {
            ...routeMeta["/"],
            title: `Blog Post - Your Site`,
            description: "Blog post description",
        };
    }
    // Fallback to 404 or home
    return routeMeta["*"] || routeMeta["/"];
}
```

## Internationalization (i18n)

### Translation Files Structure

```
public/locales/
├── en/
│   ├── common.json
│   ├── home.json
│   └── features.json
└── zh/
    ├── common.json
    ├── home.json
    └── features.json
```

### Translation File Example (`public/locales/en/common.json`)

```json
{
    "nav": {
        "home": "Home",
        "features": "Features",
        "about": "About"
    },
    "footer": {
        "copyright": "© 2024 Your Site"
    }
}
```

### Using Translations in Components

```tsx
@autoRegister({ tagName: "home-section" })
@i18n("home")  // ✅ Specify namespace
export default class HomeSection extends WebComponent {
    render() {
        return (
            <div>
                <h1>{this.t("hero.title")}</h1>
                <p>{this.t("hero.description")}</p>
                {/* Access other namespaces */}
                <p>{this.t("common:nav.home")}</p>
            </div>
        );
    }
}
```

## Error Handling

### Global Error Handler (`src/utils/error-handler.ts`)

```typescript
export class ErrorHandler {
    static init(): void {
        // Handle unhandled promise rejections
        window.addEventListener("unhandledrejection", (event) => {
            console.error("Unhandled promise rejection:", event.reason);
            // You can send to error tracking service here
        });

        // Handle JavaScript errors
        window.addEventListener("error", (event) => {
            console.error("JavaScript error:", event.error);
            // You can send to error tracking service here
        });
    }
}
```

## Component Architecture

### Container-Light, Leaf-Shadow Pattern

**Main App** (`App.wsx`): `LightComponent` (Light DOM)
- ✅ Routing container
- ✅ Navigation
- ✅ Global layout

**Page Sections** (`HomeSection.wsx`, etc.): `WebComponent` (Shadow DOM)
- ✅ Style isolation
- ✅ Reusable components
- ✅ Leaf components

**Example Structure**:
```tsx
<wsx-app>                    {/* LightComponent - Container */}
    <wsx-router>             {/* LightComponent - Container */}
        <home-section>        {/* WebComponent - Leaf */}
            <wsx-button>      {/* WebComponent - Leaf */}
                Click
            </wsx-button>
        </home-section>
    </wsx-router>
</wsx-app>
```

## Navigation Component

### Using ResponsiveNav (from `@wsxjs/wsx-base-components`)

```tsx
import "@wsxjs/wsx-base-components";

render() {
    return (
        <wsx-responsive-nav
            brand="Your Site"
            items={[
                { label: "Home", to: "/" },
                { label: "Features", to: "/features" },
                { label: "About", to: "/about" },
            ]}
        ></wsx-responsive-nav>
    );
}
```

### Custom Navigation

```tsx
private renderNavigation() {
    return (
        <nav class="main-nav">
            <wsx-link to="/" class="nav-brand">Your Site</wsx-link>
            <div class="nav-links">
                <wsx-link to="/" exact>Home</wsx-link>
                <wsx-link to="/features">Features</wsx-link>
                <wsx-link to="/about">About</wsx-link>
            </div>
        </nav>
    );
}
```

## Package Dependencies

### Required Dependencies (`package.json`)

```json
{
    "dependencies": {
        "@wsxjs/wsx-core": "workspace:*",
        "@wsxjs/wsx-base-components": "workspace:*",
        "@wsxjs/wsx-router": "workspace:*",
        "@wsxjs/wsx-i18next": "workspace:*",
        "i18next": "^23.0.0",
        "i18next-browser-languagedetector": "^7.0.0",
        "i18next-http-backend": "^2.0.0"
    },
    "devDependencies": {
        "@wsxjs/wsx-vite-plugin": "workspace:*",
        "vite": "^5.0.0",
        "typescript": "^5.0.0"
    }
}
```

## Quick Checklist

Before building a website, verify:

- [ ] Main app component extends `LightComponent` (not `WebComponent`)
- [ ] All page section components extend `WebComponent` (Shadow DOM)
- [ ] Router is configured with `wsx-router` and `wsx-view`
- [ ] Route change listener updates SEO meta tags
- [ ] i18n is initialized in `src/i18n.ts`
- [ ] Translation files are in `public/locales/`
- [ ] Components use `@i18n("namespace")` decorator
- [ ] Global styles use CSS variables for theming
- [ ] Error handler is initialized in `main.ts`
- [ ] Vite config has `cssCodeSplit: false` for Shadow DOM
- [ ] Vite config includes `wsx()` plugin
- [ ] Navigation uses `wsx-link` components
- [ ] 404 route is configured as wildcard (`route="*"`)

## Common Patterns

### Loading Data on Route Change

```tsx
@autoRegister({ tagName: "blog-post-section" })
export default class BlogPostSection extends WebComponent {
    @state private post: BlogPost | null = null;
    @state private loading = true;

    protected onConnected(): void {
        super.onConnected();
        
        RouterUtils.onRouteChange(() => {
            this.loadPost();
        });
        
        this.loadPost();
    }

    private async loadPost(): Promise<void> {
        this.loading = true;
        const routeInfo = RouterUtils.getCurrentRoute();
        const slug = routeInfo.params.slug as string;
        
        try {
            const response = await fetch(`/api/posts/${slug}`);
            this.post = await response.json();
        } catch (error) {
            console.error("Failed to load post:", error);
        } finally {
            this.loading = false;
        }
    }

    render() {
        if (this.loading) {
            return <div>Loading...</div>;
        }
        
        if (!this.post) {
            return <div>Post not found</div>;
        }
        
        return (
            <article>
                <h1>{this.post.title}</h1>
                <div>{this.post.content}</div>
            </article>
        );
    }
}
```

### Theme Switching

```tsx
@autoRegister({ tagName: "theme-switcher" })
export default class ThemeSwitcher extends WebComponent {
    @state private theme: "light" | "dark" = "light";

    protected onConnected(): void {
        super.onConnected();
        
        // Detect system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        this.theme = prefersDark ? "dark" : "light";
        this.applyTheme();
    }

    private toggleTheme = () => {
        this.theme = this.theme === "light" ? "dark" : "light";
        this.applyTheme();
    };

    private applyTheme(): void {
        document.documentElement.setAttribute("data-theme", this.theme);
        localStorage.setItem("theme", this.theme);
    }

    render() {
        return (
            <button onClick={this.toggleTheme}>
                {this.theme === "light" ? "🌙" : "☀️"}
            </button>
        );
    }
}
```

## Deployment

### GitHub Pages

1. Build for production:
```bash
pnpm build
```

2. Deploy:
```bash
pnpm deploy:pages
```

### Vite Build Configuration

```typescript
export default defineConfig({
    base: process.env.GITHUB_PAGES === "true" ? "/your-repo-name/" : "/",
    build: {
        outDir: "dist",
    },
    // ... rest of config
});
```

## Additional Resources

- [AI Agent Component Guide](./AI_AGENT_GUIDE.md) - Component development guide
- [WSXJS Router Documentation](../packages/router/README.md)
- [WSXJS i18next Documentation](../packages/i18next/README.md)

---

**Last Updated**: Based on WSXJS site implementation (2025-01-03)
