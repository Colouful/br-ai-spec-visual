import { defineConfig } from "prisma/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// 手动加载 .env 文件
try {
  const envPath = join(process.cwd(), ".env");
  const envFile = readFileSync(envPath, "utf8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
} catch (e) {
  console.warn("Warning: Could not load .env file:", e instanceof Error ? e.message : String(e));
}

export default defineConfig({
  schema: "schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "file:./dev.db",
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
