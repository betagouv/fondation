import { writeFile } from 'node:fs/promises';

import { faker } from '@faker-js/faker';

import { generateLolfiArchive } from '../src';

import { FICTITIOUS_ARCHIVE_SEED, FictitiousArchive } from './fictitious-archive';

async function main(output = 'LOLFI_CSM_fictitious.zip'): Promise<void> {
  faker.seed(FICTITIOUS_ARCHIVE_SEED);
  const archive = await generateLolfiArchive(new FictitiousArchive(faker).content());
  await writeFile(output, Buffer.from(archive));
  process.stdout.write(`${output} written\n`);
}

void main(process.argv[2]);
