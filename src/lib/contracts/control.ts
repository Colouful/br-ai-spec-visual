import { z } from 'zod';

const controlCommandBaseSchema = z.object({
  request_id: z.string().min(1),
  workspace_id: z.string().min(1),
  run_id: z.string().min(1),
  actor_id: z.string().min(1),
  comment: z.string().trim().min(1).optional(),
});

export const approveControlCommandSchema = controlCommandBaseSchema.extend({
  command: z.literal('approve'),
  decision: z.enum(['approved', 'rejected']),
});

export const resumeControlCommandSchema = controlCommandBaseSchema.extend({
  command: z.literal('resume'),
  checkpoint_id: z.string().min(1),
  reason: z.string().trim().min(1).optional(),
});

export const controlCommandSchema = z.discriminatedUnion('command', [
  approveControlCommandSchema,
  resumeControlCommandSchema,
]);

export type ApproveControlCommand = z.infer<typeof approveControlCommandSchema>;
export type ResumeControlCommand = z.infer<typeof resumeControlCommandSchema>;
export type ControlCommand = z.infer<typeof controlCommandSchema>;
