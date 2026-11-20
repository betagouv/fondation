import z from 'zod';

import { writerSchema } from './user.util';

/** the comments of the sessions, of the nomination files and of the watched positions */
export const COMMENT_MAX_LENGTH = 50_000;

export const commentLastChangeSchema = z.object({ at: z.iso.datetime(), by: writerSchema });
