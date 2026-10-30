import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { type ZodDto } from 'nestjs-zod';
import z from 'zod';

import { ATTACHMENT_MAX_BYTES } from '../attachment-max-bytes';
import { FILES_PER_UPLOAD } from '../files-per-upload';

import { MultipartBodyInterceptor } from './multipart.interceptor';
import { MultipartDestinationFactory } from './multipart.types';
import { StoreFileInterceptor } from './store-file.interceptor';

/**
 * @warning this interceptor overrides the request.body
 *
 * @example
 * ```
 * const ImportMultipartDtoSchema = z.object({ file: z.file(), data: z.object({ hello: z.string() }) });
 * class ImportMultipartDto extends createZodDto(ImportMultipartDtoSchema) {}
 *
 * @UseMultipartBody({ schema: ImportMultipartDto })
 * importFile(
 *   @Body() body: Multipart<typeof ImportMultipartDto>,
 *  ) {
 *   // ...
 * }
 * ```
 */
export function UseMultipartBody<Schema extends z.ZodObject>(options: {
  deleteOnFail?: false;
  destination?: MultipartDestinationFactory;
  /** the schema only checks a file once fully received: this cuts the upload as soon as it goes over */
  maxFileBytes?: number;
  overrideFiles?: false;
  schema: ZodDto<Schema>;
}): MethodDecorator {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({ type: options.schema }),
    UseInterceptors(
      // a json field travels as a blob, which multer counts as a file
      AnyFilesInterceptor({
        limits: { files: FILES_PER_UPLOAD + 1, fileSize: options.maxFileBytes ?? ATTACHMENT_MAX_BYTES },
      }),
      new MultipartBodyInterceptor({
        ...options,
        schema: options.schema.schema,
      }),
      StoreFileInterceptor,
    ),
  );
}
