import { z, ZodType } from "zod";

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type DateOnlyJson = {
  year: number;
  month: Month;
  day: number;
};

export const dateOnlyJsonSchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12) as ZodType<Month>,
  day: z.number().min(1).max(31),
});
