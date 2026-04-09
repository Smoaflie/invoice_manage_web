import { describe, expect, it } from "vitest";
import { renderVercelConfig } from "./buildArtifacts";
import { config } from "../../../../vercel.ts";

describe("vercel.ts config", () => {
  it("exports the shared OCR rewrites for Vercel deployments", () => {
    expect(config).toEqual(renderVercelConfig());
  });
});
