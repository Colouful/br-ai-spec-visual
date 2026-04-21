import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BR_AI_SPEC_VISUAL_APP_NAME: z.string().default("BR AI Spec Visual"),
  BR_AI_SPEC_VISUAL_COOKIE_NAME: z.string().default("br-ai-spec-visual-session"),
  BR_AI_SPEC_VISUAL_SESSION_SECRET: z.string().default("br-ai-spec-visual-dev-secret"),
});

export const serverEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BR_AI_SPEC_VISUAL_APP_NAME: process.env.BR_AI_SPEC_VISUAL_APP_NAME,
  BR_AI_SPEC_VISUAL_COOKIE_NAME: process.env.BR_AI_SPEC_VISUAL_COOKIE_NAME,
  BR_AI_SPEC_VISUAL_SESSION_SECRET: process.env.BR_AI_SPEC_VISUAL_SESSION_SECRET,
});
