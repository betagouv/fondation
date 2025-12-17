import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
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
 * type ImportMultipartDto = z.infer<typeof ImportMultipartDtoSchema>
 *
 * @UseMultipartBody({ schema: ImportMultipartDtoSchema })
 * importFile(
 *   @Body() body: Multipart<ImportMultipartDto>,
 *  ) {
 *   // ...
 * }
 * ```
 */
export function UseMultipartBody(options: {
  schema: z.ZodObject;
  destination?: MultipartDestinationFactory;
  overrideFiles?: false;
  deleteOnFail?: false;
}): MethodDecorator {
  return applyDecorators(
    UseInterceptors(
      AnyFilesInterceptor(),
      new MultipartBodyInterceptor(options),
      StoreFileInterceptor,
    ),
  );
}
