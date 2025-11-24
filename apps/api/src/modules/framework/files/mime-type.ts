export const FILE_MIME_TYPES = {
  txt: 'text/plain',
  json: 'application/json',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  heic: 'image/heic',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text',
  xsl: 'application/vnd.ms-excel',
  xslx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odp: 'application/vnd.oasis.opendocument.presentation',
} as const;

export type FileMimeType =
  (typeof FILE_MIME_TYPES)[keyof typeof FILE_MIME_TYPES];

const MIME_TYPES = new Set(Object.values(FILE_MIME_TYPES));
export function isMimeType(value: string): value is FileMimeType {
  return MIME_TYPES.has(value as any);
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
