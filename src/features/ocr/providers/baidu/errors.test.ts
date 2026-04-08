import { describe, expect, it } from "vitest";
import { parseBaiduError } from "./errors";

describe("parseBaiduError", () => {
  it("appends the documented explanation for known Baidu OCR error codes", () => {
    expect(
      parseBaiduError({
        status: 400,
        body: {
          error_code: 110,
          error_msg: "Access token invalid or no longer valid",
        },
      }),
    ).toBe("Access token invalid or no longer valid：access_token 无效，请重新获取 token 后再试。");
  });

  it("falls back to the provider error message for unknown codes", () => {
    expect(
      parseBaiduError({
        status: 400,
        body: {
          error_code: 999999,
          error_msg: "custom error",
        },
      }),
    ).toBe("custom error");
  });

  it("reads OAuth token endpoint errors before falling back to the HTTP status", () => {
    expect(
      parseBaiduError({
        status: 401,
        body: {
          error_description: "unknown client id",
          error: "invalid_client",
        },
      }),
    ).toBe("unknown client id");
  });
});
