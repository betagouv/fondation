import { File } from 'node:buffer';

import {
  applyDecorators,
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { type Request as ExpressRequest } from 'express';
import z from 'zod';

import { Observable } from 'rxjs';
import { assertIsDefined } from 'src/utils/is-defined';

/**
 * @warning this interceptor overrides the request.body
 *
 * @example
 * ```
 * const ImportMultipartDtoSchema = z.object({ file: z.file(), data: z.object({ hello: z.string() }) });
 * type ImportMultipartDto = z.infer<typeof ImportMultipartDtoSchema>
 *
 * @UseMultipartBody(ImportMultipartDtoSchema)
 * importFile(
 *   @Body() body: ImportMultipartDto,
 *  ) {
 *   // ...
 * }
 * ```
 */
export function UseMultipartBody(schema: z.ZodObject): MethodDecorator {
  return applyDecorators(
    UseInterceptors(
      AnyFilesInterceptor(),
      new MultipartBodyInterceptor(schema),
    ),
  );
}

class MultipartBodyInterceptor implements NestInterceptor {
  constructor(private readonly schema: z.ZodObject) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<ExpressRequest>();
    const { files } = request;
    if (!Array.isArray(files)) throw new BadRequestException();

    try {
      const body = parseMultipartBody(this.schema, files);
      request.body = body;
    } catch (e) {
      const logger = new Logger('MultipartBody');
      logger.warn(e);

      throw new BadRequestException();
    }

    return next.handle();
  }
}

const MulterFileSchema = z.object({
  buffer: z.instanceof(Buffer),
  fieldname: z.string(),
  mimetype: z.string(),
  /** @see https://github.com/expressjs/multer/issues/1104 */
  originalname: z
    .string()
    .transform((x) => Buffer.from(x, 'latin1').toString('utf-8')),
});

function parseMultipartBody(
  schema: z.ZodObject | undefined,
  files: Express.Multer.File[],
) {
  const multerFiles = z.array(MulterFileSchema).parse(files);
  const multipartShape = Object.fromEntries(
    multerFiles.map((file) => [file.fieldname, file]),
  );

  if (!schema) return multipartShape;

  const output: z.infer<typeof schema> = {};
  for (const key of Object.keys(schema.shape)) {
    const value = assertIsDefined(multipartShape[key], `Missing "${key}"`);

    if (schema.shape[key] instanceof z.ZodFile) {
      const file = new File([value.buffer], value?.originalname, {
        type: value.mimetype,
      });

      output[key] = schema.shape[key].parse(file);
    } else {
      let parsed: unknown;
      const text = value.buffer.toString('utf-8');

      if (value.mimetype === 'text/plain') {
        parsed = text;
      }

      if (value.mimetype === 'application/json') {
        parsed = JSON.parse(text);
      }

      if (
        value.mimetype === 'multipart/form-data' ||
        value.mimetype === 'application/x-www-form-urlencoded'
      ) {
        parsed = Object.fromEntries(new URLSearchParams(text).entries());
      }

      output[key] = schema.shape[key].parse(parsed);
    }
  }

  console.log({ output });
  return output;
}
