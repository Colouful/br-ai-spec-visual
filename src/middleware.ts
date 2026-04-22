import { type NextRequest, NextResponse } from "next/server";

/**
 * 在边缘将 `/w/:slug` 重定向到 `/w/:slug/pipeline`，避免依赖 RSC `redirect()` 的客户端
 * 导航路径与 App Router 内部 mpa/挂起逻辑发生竞争（可能触发
 * "Rendered more hooks than during the previous render"）。
 */
export function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/w\/([^/]+)\/?$/);
  if (match) {
    const next = request.nextUrl.clone();
    const slug = match[1] ?? "";
    if (!slug) {
      return NextResponse.next();
    }
    next.pathname = `/w/${slug}/pipeline`;
    return NextResponse.redirect(next, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/w/:path*"],
};
