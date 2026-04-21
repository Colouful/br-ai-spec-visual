import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

import { glob } from 'glob';

type ScannedFile = {
  path: string;
  relative_path: string;
  size: number;
  modified_at: string;
  sample?: string;
};

type ScannedGroup = {
  root: string;
  present: boolean;
  file_count: number;
  files: ScannedFile[];
};

export type WorkspaceBaseline = {
  project_root: string;
  scanned_at: string;
  registry: ScannedGroup;
  logs: ScannedGroup;
  ai_spec: ScannedGroup;
  openspec: ScannedGroup;
};

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await lstat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readSample(targetPath: string, size: number): Promise<string | undefined> {
  if (size > 64 * 1024) {
    return undefined;
  }

  try {
    return (await readFile(targetPath, 'utf8')).slice(0, 1_024);
  } catch {
    return undefined;
  }
}

async function collectFiles(rootPath: string): Promise<ScannedFile[]> {
  const stat = await lstat(rootPath);
  const filePaths = stat.isDirectory()
    ? (await glob('**/*', {
        cwd: rootPath,
        absolute: true,
        dot: true,
        nodir: true,
      })).sort()
    : [rootPath];

  return Promise.all(
    filePaths.map(async (filePath) => {
      const fileStat = await lstat(filePath);
      return {
        path: filePath,
        relative_path: path.relative(rootPath, filePath) || path.basename(filePath),
        size: fileStat.size,
        modified_at: fileStat.mtime.toISOString(),
        sample: await readSample(filePath, fileStat.size),
      };
    }),
  );
}

async function scanGroup(projectRoot: string, relativeRoot: string): Promise<ScannedGroup> {
  const absoluteRoot = path.resolve(projectRoot, relativeRoot);
  if (!(await pathExists(absoluteRoot))) {
    return {
      root: absoluteRoot,
      present: false,
      file_count: 0,
      files: [],
    };
  }

  const files = await collectFiles(absoluteRoot);
  return {
    root: absoluteRoot,
    present: true,
    file_count: files.length,
    files,
  };
}

export async function collectWorkspaceBaseline(projectRoot: string): Promise<WorkspaceBaseline> {
  const normalizedRoot = path.resolve(projectRoot);

  return {
    project_root: normalizedRoot,
    scanned_at: new Date().toISOString(),
    registry: await scanGroup(normalizedRoot, '.agents/registry'),
    logs: await scanGroup(normalizedRoot, '.omx/logs'),
    ai_spec: await scanGroup(normalizedRoot, '.ai-spec'),
    openspec: await scanGroup(normalizedRoot, 'openspec'),
  };
}
