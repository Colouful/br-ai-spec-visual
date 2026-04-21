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

    const doc = await prisma.changeDocument.findFirst({
      where: {
        OR: [
          { id: decodedId },
          { id: normalizedId },
        ],
      },
      include: { workspace: true },
    });

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
