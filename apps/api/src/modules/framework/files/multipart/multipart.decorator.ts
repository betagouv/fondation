import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { type ZodDto } from 'nestjs-zod';
import z from 'zod';

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
      AnyFilesInterceptor({ limits: { fileSize: options.maxFileBytes } }),
      new MultipartBodyInterceptor({
        ...options,
        schema: options.schema.schema,
      }),
      StoreFileInterceptor,
    ),
  );
}
