import z from 'zod';

export const privateContentSchema = z.object({ visibility: z.literal('PRIVATE') });
