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
  schema: ZodDto<Schema>;
  destination?: MultipartDestinationFactory;
  overrideFiles?: false;
  deleteOnFail?: false;
}): MethodDecorator {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({ type: options.schema }),
    UseInterceptors(
      AnyFilesInterceptor(),
      new MultipartBodyInterceptor({
        ...options,
        schema: options.schema.schema,
      }),
      StoreFileInterceptor,
    ),
  );
}
