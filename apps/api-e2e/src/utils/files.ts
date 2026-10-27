export const FILE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'video/mp4'] as const;
type FileMimeType = (typeof FILE_MIME_TYPES)[number];

/** @see https://en.wikipedia.org/wiki/List_of_file_signatures */
const MAGIC_BYTES = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d],
  'image/jpeg': [0xff, 0xd8, 0xff, 0xe1],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
} as const satisfies Record<FileMimeType, number[]>;

export function makeFile(options: { name: string; size?: number; type: FileMimeType }): File {
  const header = Buffer.from(MAGIC_BYTES[options.type]);

  const array = new Uint8Array(options.size ?? 8);
  const bytes = Buffer.from(crypto.getRandomValues(array));

  return new File([header, bytes], options.name, { type: options.type });
}
