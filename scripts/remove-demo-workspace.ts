/**
 * 一次性清理脚本：删除默认 demo workspace (slug = "br-ai-spec-demo") 及其所有关联数据。
 *
 * 使用：
 *   pnpm tsx scripts/remove-demo-workspace.ts
 *   或：npx tsx scripts/remove-demo-workspace.ts
 *
 * Workspace 的大多数子表通过 Prisma 的 onDelete: Cascade 级联删除，
 * 但 ControlOutbox 没有声明外键关系，需要先手动清理。
 */
import { prisma } from "../src/lib/db/prisma";

const TARGET_SLUG = "br-ai-spec-demo";

async function main() {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: TARGET_SLUG },
  });

  if (!workspace) {
    console.log(`[skip] 未找到 slug=${TARGET_SLUG} 的 workspace，无需清理。`);
    return;
  }

  console.log(`[found] workspace id=${workspace.id} name="${workspace.name}"`);

  // ControlOutbox 没有级联关系，先手动删
  const outboxDeleted = await prisma.controlOutbox.deleteMany({
    where: { workspaceId: workspace.id },
  });
  console.log(`[cleanup] 删除 ControlOutbox: ${outboxDeleted.count} 条`);

  // 删除 workspace 本体；其余 13 张子表通过 onDelete: Cascade 自动级联清理
  await prisma.workspace.delete({ where: { id: workspace.id } });
  console.log(`[done] workspace "${workspace.name}" 已级联删除`);
}

main()
  .catch((err) => {
    console.error("[error]", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
