/**
 * 应用技能后的输出：依赖、Vite 配置片段、代码片段与说明
 */
export interface ApplyResult {
    /** 要添加到 package.json dependencies 的键值 */
    packageJsonAdditions: Record<string, string>;
    /** Vite 配置片段（可合并到 defineConfig） */
    viteConfigSnippet?: string;
    /** 代码片段（按文件名或用途归类） */
    codeSnippets?: Record<string, string>;
    /** 人类可读的步骤说明 */
    instructions: string[];
}
