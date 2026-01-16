import { isDefined } from 'src/utils/is-defined';

export const FILE_MIME_TYPES = {
  txt: 'text/plain',
  json: 'application/json',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  heic: 'image/heic',
  gif: 'image/gif',
  webp: 'image/webp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odp: 'application/vnd.oasis.opendocument.presentation',
  bin: 'application/octet-stream',
} as const;

export type FileMimeType =
  (typeof FILE_MIME_TYPES)[keyof typeof FILE_MIME_TYPES];

export const FILE_EXTENSIONS = Object.fromEntries(
  Object.entries(FILE_MIME_TYPES).map(
    ([key, value]) => [value as FileMimeType, key] as const,
  ),
) as Record<FileMimeType, string>;

const MIME_TYPES = new Set(Object.values(FILE_MIME_TYPES));
export function isMimeType(value: unknown): value is FileMimeType {
  return MIME_TYPES.has(value as any);
}

/** @param filename a UNIX filename like {filename}.{extension}. It eventually supports format like {filename}.{extension}-{suffix} */
export function filenameToMimeType(filename: string): FileMimeType | undefined {
  const extension = filename.split('.').at(-1)?.split('-').at(0);
  return isDefined(extension) && extension in FILE_MIME_TYPES
    ? (FILE_MIME_TYPES as any)[extension]
    : undefined;
}

/**
 * @example
 * ```
 * declare const files: Express.Multer.File[];
 * const mimeTypedFiles: { mimetype: FileMimeType; originalname: string }[] =
 *     files.filter(hasMimeType('mimetype'));
 * ```
 */
export function hasMimeType<const K extends string>(key: K) {
  return <T extends Record<K, string>>(
    value: T,
  ): value is T & Record<K, FileMimeType> => {
    return isMimeType(value[key]);
  };
}
