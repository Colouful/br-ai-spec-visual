import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

function loadEnvFile(file: string, override: boolean) {
  try {
    const content = readFileSync(join(process.cwd(), file), "utf8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (!match) return;
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (override || !process.env[key]) {
        process.env[key] = value;
      }
    });
  } catch {
    // ignore missing env file
  }
}

loadEnvFile(".env", false);
loadEnvFile(".env.local", true);

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BR_AI_SPEC_VISUAL_APP_NAME: z.string().default("BR AI Spec Visual"),
  BR_AI_SPEC_VISUAL_COOKIE_NAME: z.string().default("br-ai-spec-visual-session"),
  BR_AI_SPEC_VISUAL_SESSION_SECRET: z.string().default("br-ai-spec-visual-dev-secret"),
  // 是否给会话 Cookie 打 Secure 标记。
  // 未显式设置时：NODE_ENV=production 且确实通过 HTTPS 部署才应为 true。
  // 通过 HTTP 直连 Docker/内网部署时必须为 false，否则浏览器会拒绝保存 cookie，
  // 导致登录成功后跳转仍被识别为未登录并重定向回 /login。
  BR_AI_SPEC_VISUAL_COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const serverEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BR_AI_SPEC_VISUAL_APP_NAME: process.env.BR_AI_SPEC_VISUAL_APP_NAME,
  BR_AI_SPEC_VISUAL_COOKIE_NAME: process.env.BR_AI_SPEC_VISUAL_COOKIE_NAME,
  BR_AI_SPEC_VISUAL_SESSION_SECRET: process.env.BR_AI_SPEC_VISUAL_SESSION_SECRET,
  BR_AI_SPEC_VISUAL_COOKIE_SECURE: process.env.BR_AI_SPEC_VISUAL_COOKIE_SECURE,
});
