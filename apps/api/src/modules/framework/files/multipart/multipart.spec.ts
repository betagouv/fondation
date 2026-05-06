import { type Readable } from 'node:stream';

import { Request as ExpressRequest } from 'express';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { FILE_MIME_TYPES, type FileMimeType } from '../mime-type';

import { MultipartFile } from './multipart.file';
import { parseMultipartBody } from './multipart.interceptor';
import type { Multipart, StoredFile } from './multipart.types';

describe('parseMultipartBody', () => {
  it('should parse a request containing multipart files', async () => {
    const body = await parseMultipartBody(
      request(),
      [
        file({
          fieldName: 'files',
          type: FILE_MIME_TYPES.jpg,
          originalName: 'image.jpg',
        }),
      ],
      z.object({ files: z.array(z.file()) }),
      {
        deleteOnFail: false,
        destination: () => null,
        overrideFiles: false,
      },
    );

    expect(body).toEqual({ files: expect.anything() });
    expect(body.files).toHaveLength(1);
    expect(body.files[0]).toBeInstanceOf(MultipartFile);

    const multipart = body.files[0] as MultipartFile;
    expect(multipart.name).toBe('image.jpg');
    expect(multipart.mimeType).toBe(FILE_MIME_TYPES.jpg);
    expect(multipart.id).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    expect(multipart.deleteOnFail).toBe(false);
    expect(multipart.overrideFiles).toBe(false);
    expect(multipart.path).toBeNull();
  });

  it('should parse a body with optional files', async () => {
    const body = await parseMultipartBody(request(), [], z.object({ files: z.array(z.file()).optional() }), {
      deleteOnFail: false,
      destination: () => null,
      overrideFiles: false,
    });

    expect(body).toEqual({ files: undefined });
  });

  it('should parse application/json multipart', async () => {
    const body = await parseMultipartBody(
      request(),
      [
        file({
          fieldName: 'form',
          buffer: JSON.stringify({ firstName: 'Martin', lastName: 'King' }),
          type: FILE_MIME_TYPES.json,
          originalName: 'file.json',
        }),
      ],
      z.object({
        form: z.object({ firstName: z.string(), lastName: z.string() }),
      }),
      {
        deleteOnFail: false,
        destination: () => null,
        overrideFiles: false,
      },
    );

    expect(body).toEqual({ form: { firstName: 'Martin', lastName: 'King' } });
  });

  it('should merge multer parsed body + multipart files', async () => {
    const body = await parseMultipartBody(
      request({ body: { fileId: 'file-id-1' } }),
      [
        file({
          fieldName: 'file',
          type: FILE_MIME_TYPES.pdf,
          originalName: 'report.pdf',
        }),
      ],
      z.object({
        fileId: z.string(),
        file: z.file().mime(FILE_MIME_TYPES.pdf),
      }),
      {
        deleteOnFail: false,
        destination: () => null,
        overrideFiles: false,
      },
    );

    expect(body).toEqual({
      file: expect.any(MultipartFile),
      fileId: 'file-id-1',
    });
  });
});

/* oxlint-disable @typescript-eslint/ban-ts-comment */
describe('Multipart Type', () => {
  it('should convert a z.core.File into StoredFile', () => {
    const dtoSchema = createZodDto(z.object({ files: z.array(z.file()).nullish() }));
    type Dto = Multipart<typeof dtoSchema>;

    type Assertion = NonNullable<Dto['files']> extends StoredFile[] ? 'pass' : 'fail';

    // @ts-expect-error
    const _assertion: Assertion = 'fail';
  });
});
/* eslint-enable */

function request<T>(props: { body: T | undefined } = { body: undefined }): ExpressRequest {
  return { ...props } as ExpressRequest;
}

function file(options: {
  buffer?: string;
  originalName?: string;
  fieldName: string;
  type: FileMimeType;
}): Express.Multer.File {
  return {
    destination: '',
    filename: '',
    path: '',
    size: 0,
    stream: null as unknown as Readable,
    encoding: 'utf-8',

    buffer: options.buffer ? Buffer.from(options.buffer) : Buffer.from([]),
    fieldname: options.fieldName,
    mimetype: options.type,
    originalname: options.originalName ?? 'file.bin',
  };
}
