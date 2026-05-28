import { type Request as ExpressRequest } from 'express';
import { ZodDto } from 'nestjs-zod';
import z from 'zod';

import { FileMimeType } from '../mime-type';

export type StoredFile = {
  id: string;
  path: string;
  name: string;
  type: FileMimeType;
};

type ZodMultipart<T> = {
  [K in keyof T]: NonNullable<T[K]> extends z.core.File[]
    ? StoredFile[] | Extract<T[K], null | undefined>
    : NonNullable<T[K]> extends z.core.File
      ? StoredFile | Extract<T[K], null | undefined>
      : T[K];
};

export type Multipart<T extends ZodDto<z.ZodType>> = ZodMultipart<z.infer<T['schema']>>;

export type MultipartDestinationFactory = (file: {
  id: string;
  mimetype: FileMimeType;
  originalname: string;
  request: Omit<ExpressRequest, 'params'> & { params: Record<string, string> };
}) => string | null;

export const MulterFileSchema = z.object({
  buffer: z.instanceof(Buffer),
  fieldname: z.string(),
  mimetype: z.string(),
  /** @see https://github.com/expressjs/multer/issues/1104 */
  originalname: z.string().transform((x) => Buffer.from(x, 'latin1').toString('utf-8')),
});
export type MulterFile = z.infer<typeof MulterFileSchema>;
