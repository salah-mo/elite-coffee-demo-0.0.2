import { z } from "zod";

export const preferenceSchema = z.object({
  temperature: z.enum(["hot", "iced", "either"]).optional().default("either"),
  caffeine: z
    .enum(["none", "low", "medium", "high"])
    .optional()
    .default("medium"),
  sweetness: z.enum(["low", "medium", "high"]).optional().default("medium"),
  milk: z.enum(["no-milk", "dairy", "non-dairy"]).optional().default("dairy"),
  flavors: z.array(z.string().min(1)).optional().default([]),
  budget: z.number().positive().optional(),
  sizePreference: z.enum(["Small", "Medium", "Large"]).optional(),
  featuredBoost: z.boolean().optional().default(true),
  timeOfDay: z
    .enum(["morning", "afternoon", "evening", "any"])
    .optional()
    .default("any"),
});

export type PreferenceInput = z.infer<typeof preferenceSchema>;
