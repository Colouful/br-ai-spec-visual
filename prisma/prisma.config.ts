import { defineConfig } from "prisma/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// 手动加载 .env / .env.local 文件
// 与 Next.js 一致：.env.local 优先级高于 .env
function loadEnv(file: string, override: boolean) {
  try {
    const envPath = join(process.cwd(), file);
    const envFile = readFileSync(envPath, "utf8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        if (override || !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  } catch (e) {
    // 文件不存在或无法读取就忽略
    void e;
  }
}
loadEnv(".env", false);
loadEnv(".env.local", true);

export default defineConfig({
  schema: "schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
