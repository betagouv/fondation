import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as cp from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as util from 'node:util';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { ignoreAsync } from 'src/utils/promises';

const exec = util.promisify(cp.exec);

@Injectable()
export class LolfiCryptoService {
  private readonly logger = new Logger(LolfiCryptoService.name);

  private readonly privateKeyPath: string | undefined;

  constructor(@Inject(API_CONFIG_TOKEN) { lolfi }: Pick<ApiConfig, 'lolfi'>) {
    if (!lolfi.privateKeyPath) {
      this.logger.warn(`no private key. Won't decrypt S/MIME data`);
      return;
    }

    this.privateKeyPath = lolfi.privateKeyPath;
  }

  shouldDecrypt(options: { type: string | undefined }): boolean {
    return (
      typeof options.type === 'string' &&
      options.type.startsWith(FILE_MIME_TYPES.smime)
    );
  }

  async decrypt(smimeEncrypted: Buffer): Promise<Buffer> {
    if (!this.privateKeyPath) {
      this.logger.error(`No private key available to decrypt s/mime data`);
      throw new InternalServerErrorException();
    }

    const outputPath = `/tmp/fondation/output/${crypto.randomUUID()}.bin`;
    const inputPath = `/tmp/fondation/input/${crypto.randomUUID()}.bin`;

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.mkdir(path.dirname(inputPath), { recursive: true });
    await fs.writeFile(inputPath, smimeEncrypted);

    try {
      await exec(
        `openssl smime -decrypt -out ${outputPath} -binary -inform DER -in ${inputPath} -inkey ${this.privateKeyPath}`,
      );

      return await fs.readFile(outputPath);
    } finally {
      ignoreAsync(() =>
        Promise.allSettled([inputPath, outputPath].map(fs.unlink)),
      );
    }
  }
}
