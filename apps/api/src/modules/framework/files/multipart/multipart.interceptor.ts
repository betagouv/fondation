import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { Observable } from 'rxjs';
import z from 'zod';

import { makeId } from 'src/utils/id';
import { assertIsDefined } from 'src/utils/is-defined';
import { FILE_MIME_TYPES, isMimeType } from '../mime-type';
import {
  MulterFile,
  MulterFileSchema,
  MultipartDestinationFactory,
} from './multipart.types';
import { MultipartFile } from './multipart.file';

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

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<ExpressRequest>();
    const { files } = request;
    if (!Array.isArray(files)) throw new BadRequestException();

    try {
      const body = await parseMultipartBody(
        request,
        files,
        this.schema,
        this.options,
      );

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
    {} as Record<string, MulterFile | MulterFile[]>,
  );

  if (!schema) return multipartShape;

  const output: any = {};
  for (const key of Object.keys(schema.shape)) {
    const value = assertIsDefined(multipartShape[key], `Missing "${key}"`);
    const keySchema = schema.shape[key];

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
      output[key] = await keySchema.parseAsync(parseTextualData(value));
    }
  }

  return output;
}

function isFileSchema(schema: z.ZodType): schema is z.ZodFile {
  return schema instanceof z.ZodFile;
}

function isFileArraySchema(schema: z.ZodType): schema is z.ZodArray<z.ZodFile> {
  return schema instanceof z.ZodArray && schema.element instanceof z.ZodFile;
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
  file: MulterFile | MulterFile[];
  schema: z.ZodFile;
  request: ExpressRequest;
  destination: MultipartDestinationFactory;
  deleteOnFail: boolean;
  overrideFiles: boolean;
}): Promise<MultipartFile> {
  if (Array.isArray(props.file)) throw new BadRequestException();

  const id = makeId('FileId');
  const mimeType = isMimeType(props.file.mimetype)
    ? props.file.mimetype
    : FILE_MIME_TYPES.bin;

  const path = props.destination({
    id,
    mimetype: mimeType,
    request: props.request,
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
  files: MulterFile[] | MulterFile;
  schema: z.ZodArray<z.ZodFile>;
  request: ExpressRequest;
  destination: MultipartDestinationFactory;
  deleteOnFail: boolean;
  overrideFiles: boolean;
}): Promise<MultipartFile[]> {
  const { destination, deleteOnFail, overrideFiles } = props;

  const multipartFiles = await Promise.all(
    ([] as MulterFile[]).concat(props.files).map((file) =>
      toMultipartFile({
        file,
        deleteOnFail,
        destination,
        overrideFiles,
        request: props.request,
        schema: props.schema.element,
      }),
    ),
  );
  await props.schema.parseAsync(multipartFiles);

  return multipartFiles;
}
