export const FILE_MIME_TYPES = ['image/png', 'image/jpeg', 'application/pdf'] as const;
type FileMimeType = (typeof FILE_MIME_TYPES)[number];

/** @see https://en.wikipedia.org/wiki/List_of_file_signatures */
const MAGIC_BYTES = {
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff, 0xe1],
  'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d],
} as const satisfies Record<FileMimeType, number[]>;

export function makeFile(options: { type: FileMimeType; size?: number; name: string }): File {
  const header = Buffer.from(MAGIC_BYTES[options.type]);

  const array = new Uint8Array(options.size ?? 8);
  const bytes = Buffer.from(crypto.getRandomValues(array));

  return new File([header, bytes], options.name, { type: options.type });
}
