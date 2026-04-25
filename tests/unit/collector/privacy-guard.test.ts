import { describe, expect, it } from "vitest";
import { PrivacyGuard } from "@/server/collector";

const guard = new PrivacyGuard();

describe("PrivacyGuard", () => {
  it("允许结构化相对路径 payload", () => {
    expect(() =>
      guard.assertSafe({
        projectId: "proj_1",
        changedFiles: [{ path: "src/app/page.tsx", action: "updated" }],
        privacy: {
          sourceCodeIncluded: false,
          rawPromptIncluded: false,
          rawResponseIncluded: false,
          absolutePathIncluded: false,
        },
      }),
    ).not.toThrow();
  });

  it("拒绝 sourceCode 字段", () => {
    expect(() => guard.assertSafe({ sourceCode: "const a = 1;" })).toThrow("敏感字段");
  });

  it("拒绝 rawPrompt 字段", () => {
    expect(() => guard.assertSafe({ rawPrompt: "完整提示词" })).toThrow("敏感字段");
  });

  it("拒绝 rawResponse 字段", () => {
    expect(() => guard.assertSafe({ rawResponse: "完整响应" })).toThrow("敏感字段");
  });

  it("拒绝绝对路径", () => {
    expect(() => guard.assertSafe({ changedFiles: [{ path: "/Users/demo/app.ts" }] })).toThrow("敏感字段");
  });

  it("拒绝 token/password/secret 文本", () => {
    expect(() => guard.assertSafe({ message: "token=abc" })).toThrow("敏感字段");
    expect(() => guard.assertSafe({ message: "password=abc" })).toThrow("敏感字段");
    expect(() => guard.assertSafe({ message: "secret=abc" })).toThrow("敏感字段");
  });

  it("拒绝 privacy 标识为 true", () => {
    expect(() =>
      guard.assertSafe({
        privacy: { sourceCodeIncluded: true },
      }),
    ).toThrow("敏感字段");
  });
});
