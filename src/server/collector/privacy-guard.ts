import { CollectorError } from "./errors";
import type { PrivacyFlags } from "./types";

const FORBIDDEN_KEYS = new Set([
  "sourceCode",
  "sourceContent",
  "fileContent",
  "rawPrompt",
  "rawResponse",
  "absolutePath",
  "userName",
  "apiKey",
  "password",
  "token",
  "secret",
]);

const SECRET_TEXT_RE = /(^|\b)(api[_-]?key|password|token|secret)\s*[:=]/i;
const ENV_TEXT_RE = /(^|\n)\s*[A-Z0-9_]{3,}\s*=\s*.+/;

export function isAbsolutePath(value: string) {
  return value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value);
}

function privacyError() {
  return new CollectorError(
    "PRIVACY_POLICY_VIOLATED",
    "上报数据包含不允许采集的敏感字段。",
    "请移除源码、原始提示词、原始响应、绝对路径或密钥信息后重试。",
    400,
  );
}

function checkPrivacyFlags(privacy: PrivacyFlags | undefined) {
  if (!privacy) return;
  const forbiddenTrueFlags = [
    privacy.sourceCodeIncluded,
    privacy.rawPromptIncluded,
    privacy.rawResponseIncluded,
    privacy.absolutePathIncluded,
    privacy.userNameIncluded,
  ];
  if (forbiddenTrueFlags.some((value) => value === true)) {
    throw privacyError();
  }
}

function visit(value: unknown, keyPath: string) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, `${keyPath}[${index}]`));
    return;
  }

  if (!value || typeof value !== "object") {
    if (typeof value === "string") {
      if (isAbsolutePath(value) || SECRET_TEXT_RE.test(value) || ENV_TEXT_RE.test(value)) {
        throw privacyError();
      }
    }
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw privacyError();
    }
    visit(child, keyPath ? `${keyPath}.${key}` : key);
  }
}

export class PrivacyGuard {
  assertSafe(input: unknown) {
    const privacy = input && typeof input === "object"
      ? (input as { privacy?: PrivacyFlags }).privacy
      : undefined;
    checkPrivacyFlags(privacy);
    visit(input, "");
  }

  assertRelativePath(pathValue: string) {
    if (!pathValue || isAbsolutePath(pathValue)) {
      throw privacyError();
    }
  }
}

export const defaultPrivacyGuard = new PrivacyGuard();
