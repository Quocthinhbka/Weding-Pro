import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./config", () => ({ getConfig: () => ({}) }));
vi.mock("./db", () => ({ uploadDir: () => "/tmp/wedmemo-test" }));

describe("khoá xem clip riêng tư", () => {
  it("khoá hợp lệ qua kiểm tra, hết hạn hoặc sửa chữ ký thì không", async () => {
    const { keyOk, newKey, codeOk } = await import("./wedmemo");
    const now = Date.now();
    const k = newKey(now);
    expect(keyOk(k, now)).toBe(true);
    expect(keyOk(k, now + 4 * 3600_000)).toBe(false);
    expect(keyOk(k.slice(0, -1) + (k.endsWith("0") ? "1" : "0"), now)).toBe(false);
    expect(keyOk(null)).toBe(false);
    vi.stubEnv("WEDMEMO_CODE", "2711");
    expect(codeOk("2711")).toBe(true);
    expect(codeOk("0000")).toBe(false);
    vi.stubEnv("WEDMEMO_CODE", "");
    expect(codeOk("")).toBe(false);
  });
});
