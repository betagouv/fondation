import { pipeline } from 'node:stream/promises';

import { Injectable } from '@nestjs/common';
import * as unzipper from 'unzipper';

import { Clock } from 'src/modules/framework/clock';
import { FILE_MIME_TYPES, Files } from 'src/modules/framework/files';
import { makeId } from 'src/utils/id';
import { assertIsDefined } from 'src/utils/is-defined';
import { Result, ResultBuilder } from 'src/utils/result';

import { LolfiCryptoService } from './lolfi-crypto.service';
import { passthroughHash } from './passthrough-hash';

@Injectable()
export class LolfiArchiveIngestor {
  constructor(
    private readonly files: Files,
    private readonly clock: Clock,
    private readonly crypto: LolfiCryptoService,
  ) {}

  private static readonly EXPECTED_FILES = new Set([
    'CANDIDATS.xml',
    'DESIDERATA.xml',
    'FONCTIONS.xml',
    'GRADES.xml',
    'JURIDICTIONS.xml',
    'MAGISTRATS.xml',
    'POSADS.xml',
    'POSTES_2.xml',
    'SESSIONS.xml',
    'TRANSPARENCES.xml',
    'TYPE_JURIDICTION.xml',
  ]);

  async ingest(buffer: Buffer, options: { type: string | undefined }): Promise<IngestedLolfiArchive> {
    let archiveBuffer = buffer;
    if (this.crypto.shouldDecrypt(options)) {
      archiveBuffer = await this.crypto.decrypt(buffer);
    }

    const dir = await unzipper.Open.buffer(archiveBuffer);
    const hashes = new Map(
      await Promise.all(
        dir.files
          .filter((file) => file.type === 'File' && file.path.endsWith('.sha256'))
          .map(
            async (file) =>
              [
                file.path.replace(/\.sha256$/, '.xml'),
                (await file.buffer()).toString().replace(/(\r|\n)/g, ''),
              ] as const,
          ),
      ),
    );

    const now = this.clock.now().toISOString();
    const result = new ResultBuilder<IngestedLolfiArchiveSuccess, IngestedLolfiArchiveFailed>();

    const seenFiles = new Set<string>();
    await this.files.openBatchStreamSession(async (h) => {
      for (const file of dir.files.filter((file) => file.type === 'File' && file.path.endsWith('.xml'))) {
        const fileId = makeId('FileId');
        const filePath = assertIsDefined(file.path.split('/').at(-1), `expected a file name`);

        seenFiles.add(filePath);

        const { promise: hashedPromise, stream: computeHash } = passthroughHash('sha256');

        const isHashValidPromise = hashedPromise.then((hash) => {
          const expected = hashes.get(file.path);
          if (hash !== expected) {
            result.fail({
              type: 'LolfiHashError',
              message: `Le hash de "${filePath}" (${hash.slice(0, 8)}) ne correspond pas à l'attendu (${expected?.slice(0, 8) || 'N/A'})`,
              computed: hash,
              file: filePath,
              expected,
            });
          }

          result.push({ id: fileId, name: filePath, sha256: hash });
        });

        const toFileStorage = h.streamTo({
          name: filePath,
          mimeType: FILE_MIME_TYPES.xml,
          path: `lolfi/${now}/${filePath}`,
          meta: { id: fileId },
        });

        const pipelinePromise = pipeline(file.stream(), computeHash, toFileStorage);

        await Promise.all([isHashValidPromise, pipelinePromise]);
      }
    });

    const missingFiles = LolfiArchiveIngestor.EXPECTED_FILES.difference(seenFiles);
    for (const missingFile of missingFiles) {
      result.fail({
        type: 'LolfiMissingFileError',
        message: `Le fichier "${missingFile}" est absent`,
        missingFile,
      });
    }

    return result.build();
  }
}

type LolfiHashError = {
  type: 'LolfiHashError';
  message: string;
  expected: string | undefined;
  computed: string;
  file: string;
};

type LolfiMissingFileError = {
  type: 'LolfiMissingFileError';
  message: string;
  missingFile: string;
};

export type IngestedLolfiArchiveFailed = LolfiHashError | LolfiMissingFileError;
export type IngestedLolfiArchiveSuccess = {
  id: string;
  name: string;
  sha256: string;
};

export type IngestedLolfiArchive = Result<IngestedLolfiArchiveSuccess, IngestedLolfiArchiveFailed>;
