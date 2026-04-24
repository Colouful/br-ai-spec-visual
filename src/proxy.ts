import { NextResponse } from "next/server";

/**
 * 预留代理入口。
 *
 * 说明：
 * - `/w/:slug` 现在已经由 App Router 直接渲染 `CurrentExpertWorkspace(当前专家工作台)`
 * - 这里不能再把根路径强制重定向到 `/pipeline`，否则工作台首页永远不可达
 * - 暂时保留 proxy 文件，仅做 no-op，方便后续扩展请求头或埋点
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/w/:path*"],
};
