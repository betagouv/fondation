import ExifTransformer from 'exif-be-gone';
import { type Duplex } from 'node:stream';
import { FILE_MIME_TYPES, FileMimeType } from '../mime-type';

/** this is a wrapper around [exif-be-gone](http://npmjs.com/package/exif-be-gone) */
export class ImageSanitizer {
  private static readonly SUPPORTED_MIME_TYPES: FileMimeType[] = [
    FILE_MIME_TYPES.jpg,
    FILE_MIME_TYPES.png,
    FILE_MIME_TYPES.heic,
    FILE_MIME_TYPES.webp,
  ];

  handles(mimeType: FileMimeType): boolean {
    return ImageSanitizer.SUPPORTED_MIME_TYPES.includes(mimeType);
  }

  sanitize(): Duplex {
    return new ExifTransformer();
  }
}
