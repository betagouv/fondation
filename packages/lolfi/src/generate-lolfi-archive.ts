import { createHash } from 'node:crypto';

import JSZip from 'jszip';

import { generateLolfiFiles } from './generate-lolfi-files';
import { type LolfiArchiveContent } from './types';

const ZIP_MIME = 'application/zip';

export async function generateLolfiArchive(data: LolfiArchiveContent): Promise<ArrayBuffer> {
  const archive = new JSZip();

  for await (const file of generateLolfiFiles(data)) {
    const fileContent = Buffer.from(file.buffer, 'latin1');
    archive.file(file.filename, fileContent, { binary: true });

    const hash = createHash('sha256').update(fileContent).digest('hex');
    archive.file(file.filename.replace(/\.xml$/, '.sha256'), hash, {
      binary: false,
    });
  }

  return archive.generateAsync({
    mimeType: ZIP_MIME,
    type: 'arraybuffer',
    compressionOptions: { level: 0 },
  });
}
