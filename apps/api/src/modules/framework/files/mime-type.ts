import { isDefined } from '../../../utils/is-defined';

export const FILE_MIME_TYPES = {
  bin: 'application/octet-stream',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  gif: 'image/gif',
  heic: 'image/heic',
  jpg: 'image/jpeg',
  json: 'application/json',
  mp4: 'video/mp4',
  odp: 'application/vnd.oasis.opendocument.presentation',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odt: 'application/vnd.oasis.opendocument.text',
  pdf: 'application/pdf',
  png: 'image/png',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  smime: 'application/pkcs7-mime',
  txt: 'text/plain',
  webm: 'video/webm',
  webp: 'image/webp',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xml: 'text/xml',
  zip: 'application/zip',
} as const;

export type FileMimeType = (typeof FILE_MIME_TYPES)[keyof typeof FILE_MIME_TYPES];

export const FILE_EXTENSIONS = Object.fromEntries(
  Object.entries(FILE_MIME_TYPES).map(([key, value]) => [value as FileMimeType, key] as const),
) as Record<FileMimeType, string>;

const MIME_TYPES = new Set(Object.values(FILE_MIME_TYPES));
export function isMimeType(value: unknown): value is FileMimeType {
  return MIME_TYPES.has(value as any);
}

const EXTENSION_ALIASES: Record<string, FileMimeType> = {
  jpeg: FILE_MIME_TYPES.jpg,
};

/** @param filename a UNIX filename like {filename}.{extension}. It eventually supports format like {filename}.{extension}-{suffix} */
export function filenameToMimeType(filename: string): FileMimeType | undefined {
  const extension = filename.split('.').at(-1)?.split('-').at(0)?.toLowerCase();
  if (!isDefined(extension)) return undefined;

  return (FILE_MIME_TYPES as Record<string, FileMimeType>)[extension] ?? EXTENSION_ALIASES[extension];
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
  return <T extends Record<K, string>>(value: T): value is T & Record<K, FileMimeType> => {
    return isMimeType(value[key]);
  };
}
