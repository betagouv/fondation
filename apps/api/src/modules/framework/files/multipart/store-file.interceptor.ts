import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { Request as ExpressRequest } from 'express';
import { catchError, Observable, throwError } from 'rxjs';

import { Sanitizer } from '../sanitizers';
import { Objects } from '../storable/objects.storable';
import { assertIsDefined } from 'src/utils/is-defined';
import { ignoreAsync } from 'src/utils/promises';

import { MultipartFile } from './multipart.file';
import { StoredFile } from './multipart.types';

@Injectable()
export class StoreFileInterceptor implements NestInterceptor {
  constructor(
    private readonly files: Objects,
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
            const { id, mimeType, name, path } = item;
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
        const { id, name, path } = value;
        request.body[key] = {
          id,
          name,
          path,
          type: value.mimeType,
        } satisfies StoredFile;
      }
    }

    await this.files.put(
      await Promise.all(
        multipartFiles.map(async (f) => {
          const sanitized = await Sentry.startSpan(
            {
              attributes: { 'file.size': f.size, 'file.type': f.mimeType },
              name: `fr.csm.fondation:files:sanitize`,
            },
            () => this.sanitizer.sanitize(f),
          );

          return {
            content: sanitized,
            createdById: request.user?.type === 'human' ? request.user.id : undefined,
            id: f.id,
            mime: f.mimeType,
            name: f.name,
            path: assertIsDefined(f.path, `unknown object path`),
          };
        }),
      ),
    );

    return next.handle().pipe(
      catchError((err) => {
        ignoreAsync(() =>
          this.files.delete(multipartFiles.filter((f) => f.deleteOnFail).map(({ id }) => ({ id }))),
        );

        return throwError(() => err);
      }),
    );
  }
}
