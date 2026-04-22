import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db/prisma";
import { errorResponse, HttpError, jsonResponse } from "@/server/http";

export const runtime = "nodejs";

const ALLOWED_PREFIXES = ["openspec", ".ai-spec", "docs", "specs"];
const ALLOWED_EXTS = new Set([".md", ".markdown", ".txt", ".json", ".yml", ".yaml"]);
const MAX_BYTES = 512 * 1024;

function decodeId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function isWithin(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;
    const decodedId = decodeId(id);
    const normalizedId = decodedId.replace(/:/g, "__");

    // 前端列表里的 id 是 read-model 拼接的虚拟 id：`${changeKey}__${docType}`
    // （详见 src/lib/services/read-model.ts）。所以这里要拆开来按 (changeKey, docType)
    // 查真实的 ChangeDocument，不能只按 id 查 cuid。
    // 同时兼容两种历史来源：真实 cuid、以及 changeKey 含 ":" 被替换为 "__" 的形式。
    let doc = await prisma.changeDocument.findFirst({
      where: { OR: [{ id: decodedId }, { id: normalizedId }] },
      include: { workspace: true },
    });

    if (!doc) {
      // 解析虚拟 id：从右侧分离出 docType，剩余部分作为 changeKey。
      // changeKey 本身可能包含 "__"（由原始 ":" 替换而来），因此用 lastIndexOf。
      const parseVirtualId = (raw: string): { changeKey: string; docType: string } | null => {
        const idx = raw.lastIndexOf("__");
        if (idx <= 0 || idx >= raw.length - 2) return null;
        return { changeKey: raw.slice(0, idx), docType: raw.slice(idx + 2) };
      };

      const variants = new Set<string>([decodedId, normalizedId]);
      for (const v of variants) {
        const parsed = parseVirtualId(v);
        if (!parsed) continue;
        doc = await prisma.changeDocument.findFirst({
          where: { changeKey: parsed.changeKey, docType: parsed.docType },
          include: { workspace: true },
          orderBy: { updatedAt: "desc" },
        });
        if (doc) break;
      }

      // 兜底：把整串当作 changeKey 再试一次（老数据或非标准调用方）。
      if (!doc) {
        const DOC_TYPE_PRIORITY = ["proposal", "tasks", "design", "spec"];
        const candidates = await prisma.changeDocument.findMany({
          where: { changeKey: { in: Array.from(variants) } },
          include: { workspace: true },
        });
        if (candidates.length > 0) {
          doc =
            DOC_TYPE_PRIORITY.map((t) => candidates.find((c) => c.docType === t)).find(
              (c): c is (typeof candidates)[number] => Boolean(c),
            ) ?? candidates[0];
        }
      }
    }

    if (!doc) {
      throw new HttpError(404, "未找到该变更文档");
    }

    const sourcePath = doc.sourcePath?.trim();
    if (!sourcePath) {
      throw new HttpError(404, "该文档没有可预览的源文件");
    }

    const rootPath = doc.workspace?.rootPath?.trim();
    if (!rootPath) {
      throw new HttpError(400, "工作区未配置根目录，无法解析文件路径");
    }

    const ext = path.extname(sourcePath).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      throw new HttpError(400, `不支持预览的文件类型：${ext || "(无扩展名)"}`);
    }

    const firstSegment = sourcePath.split(/[\\/]/)[0];
    if (!ALLOWED_PREFIXES.includes(firstSegment)) {
      throw new HttpError(400, `仅允许预览以下目录下的文件：${ALLOWED_PREFIXES.join(", ")}`);
    }

    const absoluteRoot = path.resolve(rootPath);
    const absoluteFile = path.resolve(absoluteRoot, sourcePath);

    if (!isWithin(absoluteRoot, absoluteFile)) {
      throw new HttpError(400, "文件路径越界");
    }

    const fileStat = await stat(absoluteFile).catch(() => null);
    if (!fileStat || !fileStat.isFile()) {
      throw new HttpError(404, `文件不存在：${sourcePath}`);
    }

    if (fileStat.size > MAX_BYTES) {
      throw new HttpError(413, `文件过大（${fileStat.size} 字节），拒绝预览`);
    }

    const content = await readFile(absoluteFile, "utf-8");

    return jsonResponse({
      sourcePath,
      absolutePath: absoluteFile,
      size: fileStat.size,
      content,
      updatedAt: fileStat.mtime.toISOString(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
