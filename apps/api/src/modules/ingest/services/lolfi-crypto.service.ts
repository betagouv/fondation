import * as cp from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as util from 'node:util';

import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { ignoreAsync } from '../../../utils/promises';
import { API_CONFIG_TOKEN, ApiConfig } from '../../framework/config';
import { FILE_MIME_TYPES } from '../../framework/files';

const execFile = util.promisify(cp.execFile);

export const ENCRYPTED_LOLFI_TYPES = [FILE_MIME_TYPES.pgp, FILE_MIME_TYPES.smime] as const;

@Injectable()
export class LolfiCryptoService {
  private readonly logger = new Logger(LolfiCryptoService.name);

  private readonly gnupgHome: string | undefined;
  private readonly privateKeyPath: string | undefined;

  constructor(@Inject(API_CONFIG_TOKEN) { lolfi }: Pick<ApiConfig, 'lolfi'>) {
    if (!lolfi.gnupgHome) this.logger.warn(`no GnuPG home. Won't decrypt PGP data`);
    if (!lolfi.privateKeyPath) this.logger.warn(`no private key. Won't decrypt S/MIME data`);

    this.gnupgHome = lolfi.gnupgHome;
    this.privateKeyPath = lolfi.privateKeyPath;
  }

  shouldDecrypt(options: { type: string | undefined }): boolean {
    return ENCRYPTED_LOLFI_TYPES.some((type) => !!options.type?.startsWith(type));
  }

  async decrypt(encrypted: Buffer, options: { type: string | undefined }): Promise<Buffer> {
    const outputPath = `/tmp/fondation/output/${crypto.randomUUID()}.bin`;
    const inputPath = `/tmp/fondation/input/${crypto.randomUUID()}.bin`;
    const [command, args] = this.decryptCommand(options, { inputPath, outputPath });

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.mkdir(path.dirname(inputPath), { recursive: true });
    await fs.writeFile(inputPath, encrypted);

    try {
      await execFile(command, args);

      return await fs.readFile(outputPath);
    } finally {
      ignoreAsync(() => Promise.allSettled([inputPath, outputPath].map(fs.unlink)));
    }
  }

  private decryptCommand(
    options: { type: string | undefined },
    { inputPath, outputPath }: { inputPath: string; outputPath: string },
  ): [string, string[]] {
    if (options.type?.startsWith(FILE_MIME_TYPES.pgp)) {
      if (!this.gnupgHome) return this.missingKey('PGP');

      // gpg exits in error on an archive signed by an unknown sender even once it is decrypted
      return [
        'gpg',
        [
          '--homedir',
          this.gnupgHome,
          '--batch',
          '--quiet',
          '--skip-verify',
          '--output',
          outputPath,
          '--decrypt',
          inputPath,
        ],
      ];
    }

    if (!this.privateKeyPath) return this.missingKey('S/MIME');

    return [
      'openssl',
      [
        'smime',
        '-decrypt',
        '-out',
        outputPath,
        '-binary',
        '-inform',
        'DER',
        '-in',
        inputPath,
        '-inkey',
        this.privateKeyPath,
      ],
    ];
  }

  private missingKey(format: 'PGP' | 'S/MIME'): never {
    this.logger.error(`No private key available to decrypt ${format} data`);
    throw new InternalServerErrorException();
  }
}
