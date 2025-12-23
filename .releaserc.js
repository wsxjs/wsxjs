/**
 * Semantic Release Configuration for WSXJS Monorepo
 *
 * This configuration handles automated versioning and publishing
 * for all packages in the monorepo based on conventional commits.
 */

module.exports = {
    // Only release from main branch
    branches: ["main"],

    // Plugins for semantic release
    plugins: [
        // Analyze commits to determine version bump
        [
            "@semantic-release/commit-analyzer",
            {
                preset: "conventionalcommits",
                releaseRules: [
                    { type: "feat", release: "minor" },
                    { type: "fix", release: "patch" },
                    { type: "perf", release: "patch" },
                    { type: "revert", release: "patch" },
                    { type: "docs", release: "patch" },
                    { type: "style", release: "patch" },
                    { type: "refactor", release: "patch" },
                    { type: "test", release: "patch" },
                    { type: "build", release: "patch" },
                    { type: "ci", release: "patch" },
                    { type: "chore", release: "patch" },
                ],
            },
        ],

        // Generate release notes
        [
            "@semantic-release/release-notes-generator",
            {
                preset: "conventionalcommits",
                presetConfig: {
                    types: [
                        { type: "feat", section: "Features" },
                        { type: "fix", section: "Bug Fixes" },
                        { type: "perf", section: "Performance Improvements" },
                        { type: "revert", section: "Reverts" },
                        { type: "docs", section: "Documentation" },
                        { type: "style", section: "Styles" },
                        { type: "refactor", section: "Code Refactoring" },
                        { type: "test", section: "Tests" },
                        { type: "build", section: "Build System" },
                        { type: "ci", section: "Continuous Integration" },
                    ],
                },
            },
        ],

        // Generate CHANGELOG.md
        [
            "@semantic-release/changelog",
            {
                changelogFile: "CHANGELOG.md",
            },
        ],

        // Update package.json versions and build packages
        [
            "@semantic-release/exec",
            {
                // Update all package versions
                prepareCmd:
                    "pnpm version ${nextRelease.version} --workspace-root --no-git-tag-version",
                // Build all packages
                publishCmd:
                    'pnpm build && pnpm publish --filter "!@wsxjs/wsx-examples" --access public --no-git-checks',
            },
        ],

        // Create GitHub release
        [
            "@semantic-release/github",
            {
                assets: [
                    {
                        path: "packages/*/dist/**",
                        label: "Distribution files",
                    },
                ],
            },
        ],

        // Commit updated files back to repository
        [
            "@semantic-release/git",
            {
                assets: ["CHANGELOG.md", "package.json", "packages/*/package.json"],
                message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
            },
        ],
    ],
};
