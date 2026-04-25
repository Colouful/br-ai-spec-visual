import type { CollectorErrorCode } from "./types";

export class CollectorError extends Error {
  code: CollectorErrorCode;
  suggestion: string;
  status: number;

  constructor(
    code: CollectorErrorCode,
    message: string,
    suggestion: string,
    status = 400,
  ) {
    super(message);
    this.name = "CollectorError";
    this.code = code;
    this.suggestion = suggestion;
    this.status = status;
  }
}

export function badRequest(message: string, suggestion = "请检查请求参数后重试。") {
  return new CollectorError("BAD_REQUEST", message, suggestion, 400);
}
