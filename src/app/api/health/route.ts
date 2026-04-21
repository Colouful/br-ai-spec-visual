import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 轻量健康探测：仅表示服务端进程存活 + 路由正常。
// 故意不查数据库，避免给遥测探针引入 DB 压力；
// 数据库健康需要时可单独新增 /api/health/db。
export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "br-ai-spec-visual",
      ts: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

export function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: { "cache-control": "no-store" },
  });
}
