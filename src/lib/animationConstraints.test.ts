import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readWorkspaceFile(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), "utf8");
}

describe("animation single-source constraints", () => {
  it("keeps AnimationPanel wired to centralized animation modules", () => {
    const source = readWorkspaceFile("src/components/AnimationPanel.tsx");

    expect(source).toContain('from "../lib/pointerMoveAnimation"');
    expect(source).toContain('from "../lib/pointerLifecycleAnimation"');
    expect(source).toContain('from "../lib/pointerRegistry"');
    expect(source).toContain('from "../lib/pointerStagePlan"');
    expect(source).toContain('from "../lib/barAnimationPolicy"');
    expect(source).toContain('from "../lib/visualBars"');
    expect(source).toContain('from "../lib/visualToneClassMap"');
  });

  it("forbids AnimationPanel hardcoded bar FLIP threshold", () => {
    const source = readWorkspaceFile("src/components/AnimationPanel.tsx");
    expect(source).not.toMatch(/Math\.abs\(delta\)\s*<\s*0\.5/);
  });

  it("forbids AnimationPanel hardcoded emphasized cubic-bezier for bar animations", () => {
    const source = readWorkspaceFile("src/components/AnimationPanel.tsx");
    expect(source).not.toMatch(
      /transform\s*\$\{[^}]+\}ms\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/
    );
    expect(source).not.toMatch(
      /height\s*\$\{[^}]+\}ms\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/
    );
  });

  it("forbids algorithm-specific branching in AnimationPanel", () => {
    const source = readWorkspaceFile("src/components/AnimationPanel.tsx");

    // Keep algorithm behavior dispatch inside algorithmSpecs, not in view logic.
    expect(source).not.toMatch(/switch\s*\(\s*algorithmId\s*\)/);
    expect(source).not.toMatch(
      /\balgorithmId\s*(===|!==)\s*["'][^"']+["']/
    );
    expect(source).not.toMatch(
      /\[[^\]]+["'][^"']+["'][^\]]*\]\.includes\(\s*algorithmId\s*\)/
    );
  });
});
