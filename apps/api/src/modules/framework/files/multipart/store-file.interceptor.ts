import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { catchError, Observable, throwError } from 'rxjs';

import { noop } from 'src/utils/noop';
import { ignoreAsync } from 'src/utils/promises';
import { Files } from '../files';
import { MultipartFile } from './multipart.file';
import { StoredFile } from './multipart.types';

@Injectable()
export class StoreFileInterceptor implements NestInterceptor {
  private readonly logger = new Logger(StoreFileInterceptor.name);
  constructor(private readonly files: Files) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
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
        multipartFiles.map(async (f) => ({
          path: f.path as string,
          name: f.name,
          meta: { id: f.id },
          buffer: Buffer.from(await f.arrayBuffer()),
        })),
      ),
    );

    return next.handle().pipe(
      catchError((err) => {
        ignoreAsync(() =>
          this.files
            .delete(
              multipartFiles
                .filter((f) => f.deleteOnFail && f.path)
                .map(({ path }) => path as string),
            )
            .catch(noop),
        );
        return throwError(() => err);
      }),
    );
  }
}
