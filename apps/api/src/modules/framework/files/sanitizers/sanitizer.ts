import type { Duplex } from 'node:stream';

import type { FileMimeType } from '../mime-type';

export interface FileSanitizer {
  handles(mimeType: FileMimeType): boolean;
  sanitize(): Duplex;
}
