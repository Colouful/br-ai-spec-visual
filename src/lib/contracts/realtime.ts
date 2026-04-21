import { z } from 'zod';

export const realtimeSourceTypeSchema = z.enum(['browser', 'collector', 'server']);

export const realtimeEventEnvelopeSchema = z.object({
  workspace_id: z.string().min(1),
  agent_id: z.string().min(1),
  connect_token: z.string().min(1),
  capabilities: z.array(z.string().min(1)).default([]),
  event_id: z.string().min(1),
  source_type: realtimeSourceTypeSchema,
  event_type: z.string().min(1),
  occurred_at: z.string().datetime({ offset: true }),
  payload: z.unknown(),
  source_path: z.string().min(1),
  content_hash: z.string().regex(/^sha256:[a-f0-9]{64}$/i),
});

export type RealtimeSourceType = z.infer<typeof realtimeSourceTypeSchema>;
export type RealtimeEventEnvelope = z.infer<typeof realtimeEventEnvelopeSchema>;
