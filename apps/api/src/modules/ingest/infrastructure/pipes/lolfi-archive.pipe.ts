import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { pipeline } from 'node:stream/promises';
import { MulterFile } from 'src/modules/framework/files/multipart/multipart.types';

import { FILE_MIME_TYPES, Files } from 'src/modules/framework/files';
import { makeId } from 'src/utils/id';
import { assertIsDefined } from 'src/utils/is-defined';
import unzipper from 'unzipper';
import { passthroughHash } from './passthrough-hash';

@Injectable()
export class LolfiArchivePipe
  implements PipeTransform<MulterFile, Promise<{ name: string; id: string }[]>>
{
  constructor(private readonly files: Files) {}

  async transform(file: MulterFile) {
    const start = performance.now();

    const dir = await unzipper.Open.buffer(file.buffer);
    const hashes = new Map(
      await Promise.all(
        dir.files
          .filter(
            (file) => file.type === 'File' && file.path.endsWith('.sha256'),
          )
          .map(
            async (file) =>
              [
                file.path.replace(/\.sha256$/, '.xml'),
                (await file.buffer()).toString().replace(/(\r|\n)/g, ''),
              ] as const,
          ),
      ),
    );

    const result = new Result();
    const now = new Date().toISOString();

    await this.files.openBatchStreamSession(async (h) => {
      for (const file of dir.files.filter(
        (file) => file.type === 'File' && file.path.endsWith('.xml'),
      )) {
        const fileId = makeId('FileId');
        const filePath = assertIsDefined(
          file.path.split('/').at(-1),
          `expected a file name`,
        );

        const { promise: hashedPromise, stream: computeHash } =
          passthroughHash('sha256');

        const isHashValidPromise = hashedPromise.then((hash) => {
          const expected = hashes.get(file.path);
          if (hash !== expected) {
            result.fail({
              message: `Le hash de "${filePath}" ne correspond pas à l'attendu`,
              expected,
              computed: hash,
              file: filePath,
            });
          }
        });

        const toFileStorage = h.streamTo({
          name: filePath,
          mimeType: FILE_MIME_TYPES.xml,
          path: `lolfi/${now}/${filePath}`,
          meta: { id: fileId },
        });

        const pipelinePromise = pipeline(
          file.stream(),
          computeHash,
          toFileStorage,
        );

        await Promise.all([isHashValidPromise, pipelinePromise]);
        result.pushData({ name: filePath, id: fileId });
      }
    });

    const duration = performance.now() - start;
    console.log('Duration %sms', duration.toFixed(2));

    if (!result.success) {
      throw new BadRequestException({
        errors: result.errors,
      });
    }

    return result.data;
  }
}

class Result {
  get success(): boolean {
    return this._success;
  }

  get errors(): readonly unknown[] {
    if (this._success) return [];
    return this._errors;
  }

  get data(): { name: string; id: string }[] {
    if (!this._success) return [];

    return this._data;
  }

  private _success: boolean = true;
  private _errors: unknown[] = [];
  private _data: { name: string; id: string }[] = [];

  fail(error: unknown): void {
    this._success = false;
    this._errors.push(error);
  }

  pushData(file: { name: string; id: string }): void {
    this._data.push(file);
  }
}
