import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { CollectorError } from "./errors";

function envelope(data: unknown, error: null | { code: string; message: string; suggestion: string }) {
  return {
    success: error === null,
    data: error === null ? data : null,
    error,
    requestId: `req_${nanoid(10)}`,
    timestamp: new Date().toISOString(),
  };
}

export function collectorSuccess(data: unknown, status = 200) {
  return NextResponse.json(envelope(data, null), { status });
}

export function collectorException(error: unknown) {
  if (error instanceof CollectorError) {
    return NextResponse.json(
      envelope(null, {
        code: error.code,
        message: error.message,
        suggestion: error.suggestion,
      }),
      { status: error.status },
    );
  }

  return NextResponse.json(
    envelope(null, {
      code: "INTERNAL_ERROR",
      message: "Collector API 处理失败。",
      suggestion: "请稍后重试，或联系管理员查看服务日志。",
    }),
    { status: 500 },
  );
}
