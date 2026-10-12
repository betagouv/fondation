import { BadRequestException, CallHandler, ExecutionContext, Logger, NestInterceptor } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { Observable } from 'rxjs';
import z from 'zod';
import type { $ZodType } from 'zod/v4/core';

import { FILE_EXTENSIONS, FILE_MIME_TYPES, isMimeType } from '../mime-type';
import { makeId } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';

import { MultipartFile } from './multipart.file';
import { MulterFile, MulterFileSchema, MultipartDestinationFactory } from './multipart.types';

export class MultipartBodyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MultipartBodyInterceptor.name);

  private readonly schema: z.ZodObject;
  private readonly options: {
    destination: MultipartDestinationFactory;
    overrideFiles: boolean;
    deleteOnFail: boolean;
  };

  constructor(props: {
    destination?: MultipartDestinationFactory;
    overrideFiles?: boolean;
    deleteOnFail?: boolean;
    schema: z.ZodObject;
  }) {
    const { schema, ...options } = props;

    this.schema = schema;
    this.options = {
      destination: options.destination ?? (() => null),
      overrideFiles: options.overrideFiles !== false,
      deleteOnFail: options.deleteOnFail !== false,
    };
  }

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<ExpressRequest>();
    const { files } = request;
    if (!Array.isArray(files)) throw new BadRequestException();

    try {
      const body = await parseMultipartBody(request, files, this.schema, this.options);

      request.body = body;
    } catch (e) {
      this.logger.warn(e);

      throw new BadRequestException();
    }

    return next.handle();
  }
}

export async function parseMultipartBody(
  request: ExpressRequest,
  files: readonly Express.Multer.File[],
  schema: z.ZodObject | undefined,
  options: {
    destination: MultipartDestinationFactory;
    overrideFiles: boolean;
    deleteOnFail: boolean;
  },
) {
  const multerFiles = z.array(MulterFileSchema).parse(files);
  const multipartShape = multerFiles.reduce(
    (output, file) => {
      const key = file.fieldname;
      if (key in output) {
        output[key] = ([] as MulterFile[]).concat(output[key] ?? [], file);
      } else {
        output[key] = file;
      }
      return output;
    },
    { ...request.body } as Record<string, MulterFile | MulterFile[]>,
  );

  if (!schema) return multipartShape;

  const output: any = {};
  for (const key of Object.keys(schema.shape)) {
    const keySchema = schema.shape[key];
    const value = multipartShape[key];

    if (isFileArraySchema(keySchema)) {
      output[key] = await toMultipartFileList({
        ...options,
        request,
        files: value,
        schema: keySchema,
      });
    } else if (isFileSchema(keySchema)) {
      output[key] = await toMultipartFile({
        ...options,
        request,
        file: value,
        schema: keySchema,
      });
    } else {
      output[key] = await keySchema.parseAsync(isMulterFile(value) ? parseTextualData(value) : value);
    }
  }

  return output;
}

type ZodOptionalSchema<T extends z.ZodType> =
  | T
  | z.ZodOptional<T>
  | z.ZodNullable<T>
  | z.ZodOptional<z.ZodNullable<T>>
  | z.ZodPipe<z.ZodType, T>;

function unwrap(schema: z.ZodType): z.ZodType | $ZodType {
  let innerSchema: z.ZodType | $ZodType = schema;

  const instances = [z.ZodOptional, z.ZodNullable, z.ZodPipe];
  while (instances.some((ctor) => innerSchema instanceof ctor)) {
    if (innerSchema instanceof z.ZodOptional || innerSchema instanceof z.ZodNullable) {
      innerSchema = innerSchema.unwrap();
    } else if (innerSchema instanceof z.ZodPipe) {
      innerSchema = innerSchema.out;
    }
  }

  return innerSchema;
}

type FileSchema = ZodOptionalSchema<z.ZodFile>;
function isFileSchema(schema: z.ZodType): schema is FileSchema {
  return unwrap(schema) instanceof z.ZodFile;
}

type FileListSchema = ZodOptionalSchema<z.ZodArray<z.ZodFile>>;
function isFileArraySchema(schema: z.ZodType): schema is FileListSchema {
  const unwrapped = unwrap(schema);
  return unwrapped instanceof z.ZodArray && unwrapped.element instanceof z.ZodFile;
}

function isMulterFile(file: unknown): file is MulterFile | MulterFile[] {
  const isSingleFile = (x: unknown): x is MulterFile => typeof x === 'object' && x !== null && 'buffer' in x;

  return Array.isArray(file) ? file.length === 0 || isSingleFile(file[0]) : isSingleFile(file);
}

function parseTextualData(file: MulterFile | MulterFile[]): unknown {
  function _parse(file: MulterFile): unknown {
    const text = file.buffer.toString('utf-8');

    if (file.mimetype === FILE_MIME_TYPES.txt) {
      return text;
    } else if (file.mimetype === FILE_MIME_TYPES.json) {
      return JSON.parse(text);
    } else if (
      file.mimetype === 'multipart/form-data' ||
      file.mimetype === 'application/x-www-form-urlencoded'
    ) {
      return Object.fromEntries(new URLSearchParams(text).entries());
    }

    throw new BadRequestException(`type de fichier inconnu "${file.mimetype}"`);
  }

  return Array.isArray(file) ? file.map(_parse) : _parse(file);
}

async function toMultipartFile(props: {
  file: MulterFile | MulterFile[] | undefined | null;
  schema: FileSchema;
  request: ExpressRequest;
  destination: MultipartDestinationFactory;
  deleteOnFail: boolean;
  overrideFiles: boolean;
}): Promise<MultipartFile | null | undefined> {
  if (!isDefined(props.file)) {
    await props.schema.parseAsync(props.file);
    return props.file;
  }

  if (Array.isArray(props.file)) throw new BadRequestException();

  const id = makeId('FileId');
  const mimeType = isMimeType(props.file.mimetype) ? props.file.mimetype : FILE_MIME_TYPES.bin;
  const ext = FILE_EXTENSIONS[mimeType];

  const path = props.destination({
    id,
    ext,
    mimetype: mimeType,
    request: props.request as Omit<ExpressRequest, 'params'> & { params: Record<string, string> },
    originalname: props.file.originalname,
  });

  const multipartFile = new MultipartFile({
    buffers: [props.file.buffer],
    filename: props.file.originalname,
    options: {
      id,
      path,
      type: mimeType,
      deleteOnFail: props.deleteOnFail,
      overrideFiles: props.overrideFiles,
    },
  });
  await props.schema.parseAsync(multipartFile);
  return multipartFile;
}

async function toMultipartFileList(props: {
  files: MulterFile[] | MulterFile | null | undefined;
  schema: FileListSchema;
  request: ExpressRequest;
  destination: MultipartDestinationFactory;
  deleteOnFail: boolean;
  overrideFiles: boolean;
}): Promise<MultipartFile[] | null | undefined> {
  if (!isDefined(props.files)) {
    await props.schema.parseAsync(props.files);
    return props.files;
  }

  const schema = unwrap(props.schema);
  if (!(schema instanceof z.ZodArray)) {
    throw new BadRequestException(`not an array`);
  }

  const { destination, deleteOnFail, overrideFiles } = props;
  const multipartFiles = await Promise.all(
    ([] as MulterFile[]).concat(props.files).map((file) =>
      toMultipartFile({
        file,
        deleteOnFail,
        destination,
        overrideFiles,
        request: props.request,
        schema: schema.element as FileSchema,
      }),
    ),
  );

  await props.schema.parseAsync(multipartFiles);
  return multipartFiles.filter(isDefined);
}
