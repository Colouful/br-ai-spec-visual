import { NextResponse } from "next/server";
import { z } from "zod";

import {
  checkRateLimit,
  ingestInstallationReport,
} from "@/lib/services/installations";
import { recordInstallationActivity } from "@/server/installations-presence";

export const runtime = "nodejs";

const bodySchema = z.object({
  installationId: z.string().min(1).max(256),
  command: z.string().min(1).max(64),
  status: z.string().min(1).max(32),
  hostname: z.string().max(255).nullish(),
  username: z.string().max(128).nullish(),
  platform: z.string().max(64).nullish(),
  arch: z.string().max(32).nullish(),
  osRelease: z.string().max(128).nullish(),
  nodeVersion: z.string().max(64).nullish(),
  cliVersion: z.string().max(64).nullish(),
  profile: z.string().max(64).nullish(),
  ides: z.unknown().nullish(),
  level: z.string().max(32).nullish(),
  projectHash: z.string().max(128).nullish(),
  projectName: z.string().max(255).nullish(),
  durationMs: z.number().finite().nullish(),
  errorMessage: z.string().max(4000).nullish(),
  occurredAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const configuredSecret = process.env.AI_SPEC_TELEMETRY_SECRET;
  if (configuredSecret) {
    const provided = request.headers.get("x-telemetry-secret");
    if (provided !== configuredSecret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  if (!checkRateLimit(`install:${data.installationId}`)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();
    const result = await ingestInstallationReport({
      installationId: data.installationId,
      command: data.command,
      status: data.status,
      hostname: data.hostname ?? null,
      username: data.username ?? null,
      platform: data.platform ?? null,
      arch: data.arch ?? null,
      osRelease: data.osRelease ?? null,
      nodeVersion: data.nodeVersion ?? null,
      cliVersion: data.cliVersion ?? null,
      profile: data.profile ?? null,
      ides: data.ides ?? null,
      level: data.level ?? null,
      projectHash: data.projectHash ?? null,
      projectName: data.projectName ?? null,
      durationMs: data.durationMs ?? null,
      errorMessage: data.errorMessage ?? null,
      occurredAt,
    });

    recordInstallationActivity({
      installationId: data.installationId,
      command: data.command,
      status: data.status,
      hostname: data.hostname ?? null,
      username: data.username ?? null,
      at: occurredAt,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[installations/report] ingest failed", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
