import z from 'zod';

// one line, as it is written in a sentence; emptied, the title is removed
export const TitleSchema = z
  .string()
  .trim()
  .transform((title) => title.replace(/[\n\r]/g, ' ') || null)
  .nullable();
