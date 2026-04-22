import { networkInterfaces } from "node:os";

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * 开发时通过「局域网 IP:端口」访问时，Next 会校验这些来源；否则
 * __nextjs_font、HMR WebSocket 等可能返回 403 / 断连。
 * 见: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
 *
 * - 默认（开发）: 自动加入本机非回环 IPv4 及 `地址:PORT` 形式（随 PORT 变化）。
 * - 额外/覆盖: 环境变量 ALLOWED_DEV_ORIGINS（逗号或空格分隔的 host，可含端口）。
 * - 仅手动手册: STRICT_DEV_ORIGINS=1 时不再自动发现，只使用 ALLOWED_DEV_ORIGINS。
 */
function discoverLanIPv4(): string[] {
  const out: string[] = [];
  for (const list of Object.values(networkInterfaces())) {
    if (!list) continue;
    for (const entry of list) {
      const fam = entry.family as string | number;
      const v4 = fam === "IPv4" || fam === 4;
      if (v4 && !entry.internal) {
        out.push(entry.address);
      }
    }
  }
  return [...new Set(out)];
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const port = String(process.env.PORT ?? "3000");
const strictDev = process.env.STRICT_DEV_ORIGINS === "1";
const manual = parseList(process.env.ALLOWED_DEV_ORIGINS);
const auto =
  isDev && !strictDev
    ? discoverLanIPv4().flatMap((host) => {
        if (port && port !== "80" && port !== "443") {
          return [host, `${host}:${port}`];
        }
        return [host];
      })
    : [];
const allowedDevOrigins = [...new Set([...manual, ...auto])];

const nextConfig: NextConfig = {
  ...(isDev && allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
