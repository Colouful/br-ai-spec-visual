import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildRuntimeInsightsFromHubLock,
  buildRuntimeReportFromHubLock,
  readHubLockProfile,
} from "@/lib/hub-lock-profile";

function workspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "visual-hub-lock-"));
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

describe("hub-lock-profile", () => {
  it("应读取根级 hub-lock 并生成资产画像", () => {
    const root = workspace();
    writeJson(path.join(root, "hub-lock.json"), {
      manifestId: "enterprise-react-standard",
      manifestVersion: "1.0.0",
      manifestChecksum: "manifest-a",
      installedAt: "2026-04-24T00:00:00.000Z",
      mode: "install",
      assets: [
        {
          kind: "skill",
          assetId: "execute-task",
          version: "1.0.0",
          checksum: "a",
          currentChecksum: "b",
          riskLevel: "L3",
        },
      ],
    });

    const profile = readHubLockProfile(root);
    expect(profile.detected).toBe(true);
    expect(profile.manifestId).toBe("enterprise-react-standard");
    expect(profile.assetCount).toBe(1);
    expect(profile.localChangedAssets).toHaveLength(1);
    expect(profile.highRiskAssets).toHaveLength(1);
  });

  it("应读取协议版 .agents/registry/hub-lock.json 并基于真实文件识别本地改动", () => {
    const root = workspace();
    writeJson(path.join(root, ".agents/registry/hub-lock.json"), {
      lockVersion: "1.0.0",
      hub: { baseUrl: "http://localhost:3000", name: "Xia Qiu Hub" },
      manifest: {
        id: "manifest_react_standard_delivery",
        slug: "react-standard-delivery",
        version: "1.0.0",
        checksum: "manifest-a",
      },
      install: {
        mode: "standard",
        cliVersion: "0.1.11",
        installedAt: "2026-04-24T00:00:00.000Z",
      },
      assets: [
        {
          kind: "skill",
          slug: "execute-task",
          version: "1.0.0",
          path: ".agents/skills/execute-task/SKILL.md",
          checksum: "expected",
          riskLevel: "L0",
        },
      ],
    });
    fs.mkdirSync(path.join(root, ".agents/skills/execute-task"), { recursive: true });
    fs.writeFileSync(path.join(root, ".agents/skills/execute-task/SKILL.md"), "# changed\n", "utf8");

    const profile = readHubLockProfile(root);
    expect(profile.manifestId).toBe("react-standard-delivery");
    expect(profile.manifestVersion).toBe("1.0.0");
    expect(profile.mode).toBe("standard");
    expect(profile.assets[0]?.assetId).toBe("execute-task");
    expect(profile.localChangedAssets).toHaveLength(1);
  });

  it("缺失 hub-lock 时应返回未检测状态", () => {
    expect(readHubLockProfile(workspace()).detected).toBe(false);
  });

  it("应基于 hub-lock 生成 RuntimeReport，且不读取业务源码", () => {
    const profile = readHubLockProfile(null);
    const report = buildRuntimeReportFromHubLock({
      projectName: "demo",
      runId: "run-1",
      stage: "implement",
      status: "success",
      durationMs: 120,
      profile,
    });
    expect(report.projectName).toBe("demo");
    expect(report.usedAssets).toEqual([]);
  });

  it("应基于 hub-lock 生成运行洞察和上报命令", () => {
    const root = workspace();
    writeJson(path.join(root, ".agents/registry/hub-lock.json"), {
      manifest: { slug: "react-standard-delivery", version: "1.0.0", checksum: "manifest-a" },
      install: { mode: "standard", installedAt: "2026-04-24T00:00:00.000Z" },
      assets: [
        {
          kind: "skill",
          slug: "execute-task",
          version: "1.0.0",
          path: ".agents/skills/execute-task/SKILL.md",
          checksum: "expected",
          riskLevel: "L0",
        },
      ],
    });
    fs.mkdirSync(path.join(root, ".agents/skills/execute-task"), { recursive: true });
    fs.writeFileSync(path.join(root, ".agents/skills/execute-task/SKILL.md"), "# changed\n", "utf8");

    const insights = buildRuntimeInsightsFromHubLock({
      projectPath: root,
      profile: readHubLockProfile(root),
    });

    expect(insights.health).toBe("warning");
    expect(insights.runtimeReportCommand).toContain("hub runtime-report");
    expect(insights.riskSignals.find((signal) => signal.label === "本地改动")?.value).toBe(1);
  });
});
