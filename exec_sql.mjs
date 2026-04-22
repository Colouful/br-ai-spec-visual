import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const url = "mysql://root:Li123456.@127.0.0.1:3306/br-ai-spec";
const prisma = new PrismaClient({ datasources: { db: { url } } });
const sql = readFileSync("/tmp/create_control_outbox.sql", "utf8");
try {
  await prisma.$executeRawUnsafe(sql);
  console.log("OK: ControlOutbox table created (or already exists)");
  const r = await prisma.$queryRawUnsafe("SHOW TABLES LIKE 'ControlOutbox'");
  console.log("verify:", r);
} catch (e) {
  console.error("FAIL:", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
