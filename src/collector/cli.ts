import { hostname } from 'node:os';

import { Command } from 'commander';
import { nanoid } from 'nanoid';

import { createCollectorEventEnvelope } from './events.ts';
import { sendRawIngestPayload } from './http-transport';
import { collectWorkspaceRawEvents } from './raw-events';
import { collectWorkspaceBaseline } from './scan.ts';
import { sendCollectorEvents } from './transport.ts';
import { readHubLockProfile } from '../lib/hub-lock-profile';

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('collector')
    .description('Scan a workspace baseline and optionally report it over WebSocket')
    .requiredOption('--workspace-id <workspaceId>', 'Target workspace id')
    .option('--project <path>', 'Project root to scan', process.cwd())
    .option('--server <url>', 'Platform base URL or websocket URL')
    .option('--agent-id <agentId>', 'Collector agent id', `collector-${hostname()}`)
    .option('--connect-token <token>', 'Signed connect token for the collector')
    .option(
      '--capability <capability...>',
      'Collector capabilities',
      ['baseline:scan', 'publish:events'],
    )
    .option('--json', 'Print JSON output only', false);

  const options = program.parse(process.argv).opts<{
    workspaceId: string;
    project: string;
    server?: string;
    agentId: string;
    connectToken?: string;
    capability: string[];
    json: boolean;
  }>();

  const baseline = await collectWorkspaceBaseline(options.project);
  const hubLockProfile = readHubLockProfile(options.project);
  const rawEvents = await collectWorkspaceRawEvents({
    projectRoot: options.project,
    workspaceId: options.workspaceId,
  });
  const runId = `run_${nanoid(12)}`;

  const result: Record<string, unknown> = {
    workspace_id: options.workspaceId,
    agent_id: options.agentId,
    run_id: runId,
    baseline,
    hub_lock: hubLockProfile,
    raw_event_count: rawEvents.length,
  };

  if (options.server) {
    // 简化模式：直接 HTTP 上报，不需要 connectToken
    // 适用于内网部署场景，通过 X-Workspace-ID header 认证
    try {
      result.ingest = await sendRawIngestPayload({
        serverUrl: options.server,
        workspaceId: options.workspaceId,
        agentId: options.agentId,
        connectToken: options.connectToken || '', // connectToken 变为可选
        sourceKind: 'baseline-batch',
        projectRoot: baseline.project_root,
        hubLock: hubLockProfile,
        rawEvents,
      });
    } catch (error) {
      result.ingest = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // WebSocket 推送（仅在提供 connectToken 时启用）
    if (options.connectToken) {
      const occurredAt = new Date().toISOString();
      const handshake = createCollectorEventEnvelope({
        workspaceId: options.workspaceId,
        agentId: options.agentId,
        connectToken: options.connectToken,
        capabilities: options.capability,
        eventType: 'session.hello',
        occurredAt,
        sourcePath: baseline.project_root,
        payload: {
          run_id: runId,
          mode: 'baseline_scan',
        },
      });
      const started = createCollectorEventEnvelope({
        workspaceId: options.workspaceId,
        agentId: options.agentId,
        connectToken: options.connectToken,
        capabilities: options.capability,
        eventType: 'baseline.scan.started',
        sourcePath: baseline.project_root,
        payload: {
          run_id: runId,
          project_root: baseline.project_root,
        },
      });
      const completed = createCollectorEventEnvelope({
        workspaceId: options.workspaceId,
        agentId: options.agentId,
        connectToken: options.connectToken,
        capabilities: options.capability,
        eventType: 'baseline.scan.completed',
        sourcePath: baseline.project_root,
        payload: {
          run_id: runId,
          ...baseline,
          hub_lock: hubLockProfile,
        },
      });

      try {
        result.transport = await sendCollectorEvents({
          serverUrl: options.server,
          handshake,
          events: [started, completed],
        });
      } catch (error) {
        result.transport = {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`workspace_id=${options.workspaceId}`);
  console.log(`agent_id=${options.agentId}`);
  console.log(`run_id=${runId}`);
  console.log(`registry_files=${baseline.registry.file_count}`);
  console.log(`log_files=${baseline.logs.file_count}`);
  console.log(`ai_spec_files=${baseline.ai_spec.file_count}`);
  console.log(`openspec_files=${baseline.openspec.file_count}`);
  console.log(`hub_manifest=${hubLockProfile.manifestId || '未检测'}`);
  console.log(`hub_assets=${hubLockProfile.assetCount}`);
  console.log(`raw_events=${rawEvents.length}`);
  if (result.transport) {
    console.log(`reported_to=${(result.transport as { websocket_url: string }).websocket_url}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
