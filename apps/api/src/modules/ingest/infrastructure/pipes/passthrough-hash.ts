import { createHash } from 'node:crypto';
import { PassThrough } from 'node:stream';

export function passthroughHash(algorithm: string): {
  stream: PassThrough;
  promise: Promise<string>;
} {
  const stream = new PassThrough();
  const hash = createHash(algorithm);

  const promise = new Promise<string>((resolve, reject) => {
    stream.on('error', reject);
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
  });

  stream.on('data', (chunk) => hash.update(chunk));

  return { stream, promise };
}
