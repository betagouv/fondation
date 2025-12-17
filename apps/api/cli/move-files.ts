import * as assert from 'node:assert/strict';
import cluster, { type Worker } from 'node:cluster';
import { createHash } from 'node:crypto';
import * as os from 'node:os';
import { setTimeout } from 'node:timers/promises';

import {
  DeleteObjectCommand,
  CopyObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { lastValueFrom, Observable, switchMap } from 'rxjs';

import { PrismaClient } from '../src/generated/prisma/client';

type Message =
  | { command: 'DONE' }
  | {
      command: 'MOVE';
      args: {
        fileId: string;
        source: { path: string; bucketName: string };
        destination: { path: string; bucketName: string };
      };
    }
  | {
      command: 'RENAME';
      args: {
        fileId: string;
        bucketName: string;
        source: string;
        destination: string;
      };
    };

main();
async function main() {
  if (cluster.isPrimary) {
    await orchestrator();
  } else {
    await worker();
  }
}

async function orchestrator() {
  /**
   * +--------------+
   * | ORCHESTRATOR |
   * +--------------+
   */

  assert.ok(
    process.env.S3_REPORTS_ATTACHED_FILES_BUCKET,
    'missing "S3_REPORTS_ATTACHED_FILES_BUCKET" envvar',
  );

  const cpusCount = os.availableParallelism();
  // Not more than 4, not less than 1
  const processCount = Math.min(Math.max(cpusCount - 1, 1), 4);

  const workers: Worker[] = [];
  for (let i = 0; i < processCount; i++) {
    workers.push(cluster.fork());
  }

  console.log('%d workers created', workers.length);

  await withPrisma(async (prisma) => {
    const reportFiles = await prisma.reportFile.findMany({
      select: {
        reportId: true,
        file: { select: { id: true, name: true, path: true, bucket: true } },
      },
    });

    for (let i = 0; i < reportFiles.length; i++) {
      const worker = workers[i % workers.length]!;
      const { file, reportId } = reportFiles[i]!;
      const extension = file.name.split('.').at(-1);

      worker.send({
        command: 'RENAME',
        args: {
          fileId: file.id,
          bucketName: file.bucket,
          source: file.path.concat(file.name).join('/'),
          destination: `reports/${reportId}/${file.id}.${extension}`,
        },
      } satisfies Message);
    }

    const sessionFiles = await prisma.sessionAttachment.findMany({
      select: {
        sessionId: true,
        file: { select: { id: true, name: true, path: true, bucket: true } },
      },
    });

    await prisma.$disconnect().catch(console.error);

    for (let i = 0; i < sessionFiles.length; i++) {
      const worker = workers[i % workers.length]!;
      const { file, sessionId } = sessionFiles[i]!;
      const extension = file.name.split('.').at(-1);

      worker.send({
        command: 'MOVE',
        args: {
          fileId: file.id,
          source: {
            bucketName: file.bucket,
            path: file.path.concat(file.name).join('/'),
          },
          destination: {
            bucketName: process.env.S3_REPORTS_ATTACHED_FILES_BUCKET!,
            path: `sessions/${sessionId}/${file.id}.${extension}`,
          },
        },
      } satisfies Message);
    }

    for (const worker of workers) {
      worker.send({ command: 'DONE' } satisfies Message);
    }

    while (workers.some((worker) => worker.isConnected())) {
      // let's wait for all workers to disconnect
      await setTimeout(100);
    }

    console.log('\n✓ DONE !\n');
  });
}

async function worker() {
  /**
   * +--------+
   * | WORKER |
   * +--------+
   */

  const messages$ = new Observable<Message>((subscriber) => {
    process.on('message', (message: Message) => {
      if (message.command === 'DONE') {
        subscriber.complete();
      }

      subscriber.next(message);
    });
  });

  await withPrisma(async (prisma) => {
    await lastValueFrom(
      messages$.pipe(
        switchMap(async (message) => {
          try {
            if (message.command === 'MOVE') {
              await moveFile({ prisma, ...message.args });
            } else if (message.command === 'RENAME') {
              await moveFile({
                prisma,
                fileId: message.args.fileId,
                source: {
                  bucketName: message.args.bucketName,
                  path: message.args.source,
                },
                destination: {
                  bucketName: message.args.bucketName,
                  path: message.args.destination,
                },
              });
            } else {
              console.warn(
                `[worker:${cluster.worker?.id}] Unknown command: "${message.command}"`,
              );
            }
          } catch (err) {
            console.error(`[worker:${cluster.worker?.id}] ERROR: ${err}`);
          }
        }),
      ),
    ).catch(() => {});
  });

  cluster.worker?.disconnect();
}

async function moveFile({
  prisma,
  fileId,
  source,
  destination,
}: {
  prisma: PrismaClient;
  fileId: string;
  source: { path: string; bucketName: string };
  destination: { path: string; bucketName: string };
}) {
  const sse = makeSSE();
  const s3 = makeS3();

  console.log(
    `[worker:${cluster.worker?.id}] copy ${source.bucketName}/${source.path} → ${destination.bucketName}/${destination.path}`,
  );

  await s3.send(
    new CopyObjectCommand({
      Key: encodeURI(destination.path),
      Bucket: destination.bucketName,
      CopySource: encodeURI(`${source.bucketName}/${source.path}`),
      IfNoneMatch: '*',

      ...sse,
      ...Object.fromEntries(
        Object.entries(sse).map(
          ([key, value]) => [`CopySource${key}`, value] as const,
        ),
      ),
    }),
  );

  try {
    await prisma.file.update({
      where: { id: fileId },
      data: {
        bucket: destination.bucketName,
        path: destination.path.split('/'),
      },
    });

    console.log(
      `[worker:${cluster.worker?.id}] ✔️ ${source.bucketName}/${source.path} → ${destination.bucketName}/${destination.path}`,
    );
  } catch (err) {
    console.error(
      `[worker:${cluster.worker?.id}] ❌ ${source.bucketName}/${source.path} → ${destination.bucketName}/${destination.path}`,
    );
    console.error(err);

    await s3
      .send(
        new DeleteObjectCommand({
          ...sse,
          Key: encodeURI(destination.path),
          Bucket: destination.bucketName,
        }),
      )
      .catch(() => {});
  }
}

function makeS3(): S3Client {
  assert.ok(process.env.SCW_ACCESS_KEY, 'missing "SCW_ACCESS_KEY" envvar');
  assert.ok(process.env.SCW_SECRET_KEY, 'missing "SCW_SECRET_KEY" envvar');

  return new S3Client({
    region: 'fr-par',
    endpoint: 'https://s3.fr-par.scw.cloud',
    credentials: {
      accessKeyId: process.env.SCW_ACCESS_KEY,
      secretAccessKey: process.env.SCW_SECRET_KEY,
    },
  });
}

function withPrisma(
  action: (prisma: PrismaClient) => Promise<unknown>,
): Promise<unknown> {
  assert.ok(process.env.DATABASE_URL, 'missing "DATABASE_URL" envvar');

  const prisma = new PrismaClient({
    adapter: new PrismaPg(
      new Pool({
        max: 10, // We restrict the connections to prevent exhausting all available connections on the server (usually 100)
        connectionString: process.env.DATABASE_URL,
      }),
    ),
  });

  return action(prisma).finally(() =>
    prisma.$disconnect().catch(console.error),
  );
}

let SSE_CACHE:
  | {
      SSECustomerAlgorithm: 'AES256';
      SSECustomerKey: string;
      SSECustomerKeyMD5: string;
    }
  | undefined;

function makeSSE() {
  if (!SSE_CACHE) {
    assert.ok(
      process.env.SCW_ENCRYPTION_KEY,
      'missing "SCW_ENCRYPTION_KEY" envvar',
    );

    const SSECustomerAlgorithm = 'AES256';
    const SSECustomerKey = process.env.SCW_ENCRYPTION_KEY;
    const SSECustomerKeyMD5 = createHash('md5')
      .update(SSECustomerKey)
      .digest('base64');

    SSE_CACHE = { SSECustomerAlgorithm, SSECustomerKey, SSECustomerKeyMD5 };
  }

  return SSE_CACHE;
}
