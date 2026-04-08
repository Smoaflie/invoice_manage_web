import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

describe("WorkspaceDashboard layout styles", () => {
  test("uses auto-growing dashboard rows so the surface does not create an inner vertical scrollbar", () => {
    const stylesheet = readFileSync(resolve(process.cwd(), "src/styles/workspace-dashboard.css"), "utf8");

    expect(stylesheet).toMatch(/grid-auto-rows:\s*minmax\(140px,\s*auto\);/);
  });
});
