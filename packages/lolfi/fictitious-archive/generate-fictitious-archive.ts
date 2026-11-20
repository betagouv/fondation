import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { faker } from '@faker-js/faker';

import { generateLolfiArchive, type LolfiArchiveContent } from '../src';

import { FICTITIOUS_ARCHIVE_SEED, FictitiousArchive } from './fictitious-archive';

/* Seeded each time: both archives must draw the same people, posts and identifiers */
async function write(
  output: string,
  content: (archive: FictitiousArchive) => LolfiArchiveContent,
): Promise<void> {
  faker.seed(FICTITIOUS_ARCHIVE_SEED);
  const archive = await generateLolfiArchive(content(new FictitiousArchive(faker)));
  await writeFile(output, Buffer.from(archive));
  process.stdout.write(`${resolve(output)} written\n`);
}

async function main(output = 'LOLFI_CSM_fictitious.zip'): Promise<void> {
  await write(output, (archive) => archive.content());
  await write(output.replace(/\.zip$/, '_departures.zip'), (archive) =>
    archive.afterDepartures(archive.content()),
  );
}

void main(process.argv[2]);
