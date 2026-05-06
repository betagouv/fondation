import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

import { MultipartFile } from '../multipart/multipart.file';

import { ImageSanitizer } from './image.sanitizer';
import { PdfSanitizer } from './pdf.sanitizer';

@Injectable()
export class Sanitizer implements OnApplicationBootstrap {
  private readonly sanitizers = [new PdfSanitizer(), new ImageSanitizer()];

  async sanitize(file: MultipartFile): Promise<MultipartFile> {
    const transformers = this.sanitizers.filter((s) => s.handles(file.mimeType)).map((x) => x.sanitize());

    if (transformers.length === 0) return file;

    const chunks: Buffer[] = [];
    await pipeline([
      Readable.fromWeb(file.stream()),
      ...transformers,
      new Writable({
        write(chunk, _encoding, callback) {
          chunks.push(chunk);
          callback();
        },
      }),
    ]);

    return file.clone(chunks);
  }

  async onApplicationBootstrap(): Promise<void> {
    await Promise.allSettled(
      this.sanitizers
        .filter((sanitizer) => 'onApplicationBootstrap' in sanitizer)
        .map((sanitizer: unknown) => (sanitizer as OnApplicationBootstrap).onApplicationBootstrap()),
    );
  }
}
