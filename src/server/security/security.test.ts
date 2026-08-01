import { describe, expect, it } from "vitest";
import { secureCompareBearer, validatePublicQuery } from "./request-security";
describe("request security", () => {
  it("rejects duplicate, prototype, control, and oversized parameters", () => {
    expect(validatePublicQuery(new URL("https://x.test/api?width=400&width=500"))).toContain("Duplicate");
    expect(validatePublicQuery(new URL("https://x.test/api?__proto__=x"))).toBe("Invalid query parameter.");
    expect(validatePublicQuery(new URL(`https://x.test/api?x=${"a".repeat(513)}`))).toBe("Query parameter is too long.");
    expect(validatePublicQuery(new URL(`https://x.test/api?x=${encodeURIComponent("\u0000")}`))).toBe("Query contains invalid characters.");
  });
  it("accepts bounded normalized queries", () => expect(validatePublicQuery(new URL("https://x.test/api?username=octocat&width=480"))).toBeNull());
  it("compares bearer credentials without accepting prefixes or length mismatches", () => {
    expect(secureCompareBearer(new Request("https://x.test", { headers: { authorization: "Bearer correct-secret-value" } }), "correct-secret-value")).toBe(true);
    expect(secureCompareBearer(new Request("https://x.test", { headers: { authorization: "Bearer wrong" } }), "correct-secret-value")).toBe(false);
  });
});
