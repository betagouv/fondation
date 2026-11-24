import * as cp from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as util from 'node:util';

import { FILE_MIME_TYPES } from '../../framework/files';

import { LolfiCryptoService } from './lolfi-crypto.service';

const exec = util.promisify(cp.exec);

describe('LolfiCryptoService', () => {
  const archive = Buffer.from('LOLFI_CSM archive');
  let dir: string;
  let gnupgHome: string;
  let senderHome: string;
  let service: LolfiCryptoService;

  beforeAll(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lolfi crypto-'));
    gnupgHome = path.join(dir, 'gnupg');
    senderHome = path.join(dir, 'sender');
    await fs.mkdir(gnupgHome, { mode: 0o700 });
    await fs.mkdir(senderHome, { mode: 0o700 });
    await fs.writeFile(path.join(dir, 'archive.zip'), archive);

    await exec(
      `gpg --homedir "${gnupgHome}" --batch --passphrase '' --quick-gen-key 'Fondation test' default default never`,
    );
    await exec(
      `gpg --homedir "${senderHome}" --batch --passphrase '' --quick-gen-key 'AFTM test' default default never`,
    );
    await exec(
      `gpg --homedir "${gnupgHome}" --export 'Fondation test' | gpg --homedir "${senderHome}" --batch --import`,
    );
    await exec(
      `openssl req -x509 -newkey rsa:2048 -nodes -subj /CN=test -days 1 -keyout "${dir}/key.pem" -out "${dir}/cert.pem"`,
    );

    service = new LolfiCryptoService({
      lolfi: { gnupgHome, maxDeactivationRatio: 0.02, privateKeyPath: path.join(dir, 'key.pem') },
    });
  });

  afterAll(async () => {
    await exec(`gpgconf --homedir "${gnupgHome}" --kill all`);
    await exec(`gpgconf --homedir "${senderHome}" --kill all`);
    await fs.rm(dir, { force: true, recursive: true });
  });

  it('decrypts an archive encrypted in PGP', async () => {
    await exec(
      `gpg --homedir "${senderHome}" --batch --trust-model always --recipient 'Fondation test' --output "${dir}/archive.zip.pgp" --encrypt "${dir}/archive.zip"`,
    );
    const encrypted = await fs.readFile(path.join(dir, 'archive.zip.pgp'));

    expect(await service.decrypt(encrypted, { type: FILE_MIME_TYPES.pgp })).toEqual(archive);
  });

  it('decrypts an archive encrypted in PGP and signed by a sender whose key it does not hold', async () => {
    await exec(
      `gpg --homedir "${senderHome}" --batch --trust-model always --recipient 'Fondation test' --local-user 'AFTM test' --output "${dir}/signed.zip.pgp" --sign --encrypt "${dir}/archive.zip"`,
    );
    const encrypted = await fs.readFile(path.join(dir, 'signed.zip.pgp'));

    expect(await service.decrypt(encrypted, { type: FILE_MIME_TYPES.pgp })).toEqual(archive);
  });

  it('decrypts an archive encrypted in S/MIME', async () => {
    await exec(
      `openssl smime -encrypt -binary -aes256 -outform DER -in "${dir}/archive.zip" -out "${dir}/archive.zip.aes" "${dir}/cert.pem"`,
    );
    const encrypted = await fs.readFile(path.join(dir, 'archive.zip.aes'));

    expect(await service.decrypt(encrypted, { type: FILE_MIME_TYPES.smime })).toEqual(archive);
  });
});
