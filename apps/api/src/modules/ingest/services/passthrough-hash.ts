import { createHash } from 'node:crypto';
import { PassThrough } from 'node:stream';

/**
 * Hashes files, without discarding the original content.
 * nodejs {@link Hash} are already {@link Transform} streams,
 * but they discard the original chunks in favor of the hash.
 * This function provides a way to compute the hash while
 * streaming the content.
 *
 * @example
 * ```
 * const { promise, stream: toSha256 } = passthroughHash('sha256');
 * const read$ = fs.createReadStream('file.txt');
 * const write$ = fs.createWriteStream('output.txt');
 *
 * const hashedPromise = promise.then((hash) => {
 *   console.log('file.txt sha256', hash)
 * })
 *
 * await Promise.all([pipeline(read$, toSha256, write$), hashedPromise]);
 * ```
 *
 * @see LolfiArchiveIngestor
 */
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
