import z from 'zod';
import { type Request as ExpressRequest } from 'express';
import { FileMimeType } from '../mime-type';
import { ZodDto } from 'nestjs-zod';

export type StoredFile = {
  id: string;
  path: string;
  name: string;
  type: FileMimeType;
};

type FileToStored<T> = T extends z.core.File[]
  ? StoredFile[]
  : T extends z.core.File
    ? StoredFile
    : T;

type ZodMultipart<T> = {
  [K in keyof T]: FileToStored<T[K]>;
};

export type Multipart<T extends ZodDto<z.ZodType>> = ZodMultipart<
  z.infer<T['schema']>
>;
export type MultipartDestinationFactory = (file: {
  id: string;
  mimetype: FileMimeType;
  originalname: string;
  request: ExpressRequest;
}) => string | null;

export const MulterFileSchema = z.object({
  buffer: z.instanceof(Buffer),
  fieldname: z.string(),
  mimetype: z.string(),
  /** @see https://github.com/expressjs/multer/issues/1104 */
  originalname: z
    .string()
    .transform((x) => Buffer.from(x, 'latin1').toString('utf-8')),
});
export type MulterFile = z.infer<typeof MulterFileSchema>;
