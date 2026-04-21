import { readFile } from "node:fs/promises";
import path from "node:path";

import { glob } from "glob";

import { parseOmxJsonlSource } from "@/lib/ingest/omx-jsonl-source";
import { parseRegistrySource } from "@/lib/ingest/registry-source";
import { parseRuntimeStateSource } from "@/lib/ingest/runtime-state-source";

export async function collectWorkspaceRawEvents(input: {
  projectRoot: string;
  workspaceId: string;
}) {
  // 扫描角色注册表
  const registryFiles = await glob(".agents/registry/*.json", {
    cwd: input.projectRoot,
    absolute: true,
    nodir: true,
  });

  // 扫描 OMX 日志
  const omxFiles = await glob(".omx/logs/*.jsonl", {
    cwd: input.projectRoot,
    absolute: true,
    nodir: true,
  });

  // 扫描当前运行态
  const currentRunFiles = await glob(".ai-spec/current-run.json", {
    cwd: input.projectRoot,
    absolute: true,
    nodir: true,
  });

  // 扫描历史 run 记录（新增）
  const historyRunFiles = await glob(".ai-spec/history/run_*/runtime-state.json", {
    cwd: input.projectRoot,
    absolute: true,
    nodir: true,
  });

  // 扫描仓库地图（新增）
  const repoMapFiles = await glob(".ai-spec/repo-map.json", {
    cwd: input.projectRoot,
    absolute: true,
    nodir: true,
  });

  const rawEvents = [];

  // 解析角色注册表
  for (const filePath of registryFiles) {
    try {
      const content = await readFile(filePath, "utf8");
      rawEvents.push(
        ...parseRegistrySource({
          workspaceId: input.workspaceId,
          sourcePath: path.relative(input.projectRoot, filePath),
          content,
        }),
      );
    } catch (error) {
      console.warn(`[collector] failed to parse registry file: ${filePath}`, error);
    }
  }

  // 解析 OMX 日志
  for (const filePath of omxFiles) {
    try {
      const content = await readFile(filePath, "utf8");
      rawEvents.push(
        ...parseOmxJsonlSource({
          workspaceId: input.workspaceId,
          sourcePath: path.relative(input.projectRoot, filePath),
          content,
        }),
      );
    } catch (error) {
      console.warn(`[collector] failed to parse omx file: ${filePath}`, error);
    }
  }

  // 解析当前运行态
  for (const filePath of currentRunFiles) {
    try {
      const content = await readFile(filePath, "utf8");
      rawEvents.push(
        ...parseRuntimeStateSource({
          workspaceId: input.workspaceId,
          sourcePath: path.relative(input.projectRoot, filePath),
          content,
        }),
      );
    } catch (error) {
      console.warn(`[collector] failed to parse current-run file: ${filePath}`, error);
    }
  }

  // 解析历史 run 记录（新增）
  for (const filePath of historyRunFiles) {
    try {
      const content = await readFile(filePath, "utf8");
      rawEvents.push(
        ...parseRuntimeStateSource({
          workspaceId: input.workspaceId,
          sourcePath: path.relative(input.projectRoot, filePath),
          content,
        }),
      );
    } catch (error) {
      console.warn(`[collector] failed to parse history run file: ${filePath}`, error);
    }
  }

  // 解析仓库地图（新增）
  for (const filePath of repoMapFiles) {
    try {
      const content = await readFile(filePath, "utf8");
      const repoMap = JSON.parse(content);
      
      // 生成仓库地图快照事件
      rawEvents.push({
        sourceKind: "repo-map-json" as const,
        sourcePath: path.relative(input.projectRoot, filePath),
        eventType: "repo-map.snapshot" as const,
        eventKey: `${input.workspaceId}:repo-map:${Date.now()}`,
        dedupeKey: `repo-map:${input.workspaceId}:${JSON.stringify(repoMap).substring(0, 100)}`,
        checksum: JSON.stringify(repoMap).substring(0, 100),
        occurredAt: new Date().toISOString(),
        entityType: "repo-map" as const,
        entityId: input.workspaceId,
        payload: repoMap,
      });
    } catch (error) {
      console.warn(`[collector] failed to parse repo-map file: ${filePath}`, error);
    }
  }

  return rawEvents;
}
