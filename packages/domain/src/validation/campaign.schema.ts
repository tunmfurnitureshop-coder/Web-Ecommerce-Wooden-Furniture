import { z } from "zod";

export const campaignSlugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens");

export const campaignCodeSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase alphanumeric");

export type CampaignSlugInput = z.infer<typeof campaignSlugSchema>;
export type CampaignCodeInput = z.infer<typeof campaignCodeSchema>;
