import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { Request as ExpressRequest } from 'express';
import { catchError, Observable, throwError } from 'rxjs';

import { Files } from '../files';
import { Sanitizer } from '../sanitizers';

import { MultipartFile } from './multipart.file';
import { StoredFile } from './multipart.types';

@Injectable()
export class StoreFileInterceptor implements NestInterceptor {
  constructor(
    private readonly files: Files,
    private readonly sanitizer: Sanitizer,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    if (context.getType() !== 'http') return next.handle();

    const multipartFiles: MultipartFile[] = [];
    const request = context.switchToHttp().getRequest<ExpressRequest>();
    for (const [key, value] of Object.entries(request.body)) {
      if (!Array.isArray(value) && !(value instanceof MultipartFile)) continue;

      if (Array.isArray(value)) {
        let shouldOverrideBody = false;
        const bodyOverride: StoredFile[] = [];
        for (const item of value) {
          if (!(item instanceof MultipartFile) || !item.path) continue;

          multipartFiles.push(item);

          if (item.overrideFiles) {
            const { id, path, name, mimeType } = item;
            shouldOverrideBody = true;
            bodyOverride.push({ id, name, path, type: mimeType });
          }
        }

        if (shouldOverrideBody) request.body[key] = bodyOverride;
        continue;
      }

      if (!value.path) continue;

      multipartFiles.push(value);
      if (value.overrideFiles) {
        const { id, path, name } = value;
        request.body[key] = {
          id,
          name,
          path,
          type: value.mimeType,
        } satisfies StoredFile;
      }
    }

    await this.files.create(
      await Promise.all(
        multipartFiles.map(async (f) => {
          const sanitized = await Sentry.startSpan(
            {
              name: `fr.csm.fondation:files:sanitize`,
              attributes: { 'file.type': f.mimeType, 'file.size': f.size },
            },
            () => this.sanitizer.sanitize(f),
          );

          const buffer = Buffer.from(await sanitized.arrayBuffer());
          return {
            path: f.path as string,
            name: f.name,
            size: buffer.length,
            meta: { id: f.id },
            buffer,
          };
        }),
      ),
    );

    return next.handle().pipe(
      catchError((err) => {
        this.files.delete(
          multipartFiles
            .filter((f) => Boolean(f.deleteOnFail && f.path))
            .map(({ id, path }) => ({ id, path: (path as string).split('/') })),
        );

        return throwError(() => err);
      }),
    );
  }
}
