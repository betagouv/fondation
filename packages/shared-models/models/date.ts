import { z } from 'zod';

export type DateOnlyJson = {
  year: number;
  month: number;
  day: number;
};

export const dateOnlyJsonSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12),
  day: z.number().min(1).max(31),
});
