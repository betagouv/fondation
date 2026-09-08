import { randomInt } from 'node:crypto';

import { HttpStatus } from '@nestjs/common';
import { generateLolfiArchive, type LolfiData } from 'lolfi';
import supertest from 'supertest';
import waitForExpect from 'wait-for-expect';

import { PrismaJobStatusEnum } from '../../src/generated/prisma/enums';
import { FILE_MIME_TYPES } from '../../src/modules/framework/files';
import { IngestedLolfiArchiveDto } from '../../src/modules/ingest/infrastructure/ingest.dto';
import { DetailedJobDto } from '../../src/modules/ingest/jobs/queries/details-job.query';
import { assertIsDefined } from '../../src/utils/is-defined';

export async function ingestSessions(options: {
  cookie: string;
  sessions: LolfiData['sessions'];
  http: ReturnType<typeof supertest.agent>;
}): Promise<number> {
  const archive = await generateLolfiArchive({ sessions: options.sessions });

  const ingestionResponse = await options.http
    .post('/api/ingest/v1/lolfi')
    .set({ cookie: options.cookie })
    .attach('file', archive, {
      filename: 'LOLFI_CSM_' + new Date().toISOString() + `.zip`,
      contentType: FILE_MIME_TYPES.zip,
    })
    .expect(HttpStatus.OK);

  const { id: jobId } = ingestionResponse.body as IngestedLolfiArchiveDto;
  await waitForExpect(async () => {
    const job = await detailsJob({ ...options, jobId });

    if (job.status === 'FAILED') {
      console.error(job.errors);
      console.error(job.files.map((file) => file.errors));
      expect(job.status).toBe('FAILED');
    }

    expect(job.status).toBe('SUCCEEDED' satisfies PrismaJobStatusEnum);
  }, /* timeout */ 2_000);

  return jobId;
}

export async function detailsJob(options: {
  cookie: string;
  jobId: number;
  http: ReturnType<typeof supertest.agent>;
}): Promise<DetailedJobDto> {
  const jobResponse = await options.http
    .get(`/api/jobs/v1/${options.jobId}`)
    .set({ cookie: options.cookie })
    .expect(HttpStatus.OK);

  return jobResponse.body as DetailedJobDto;
}

export async function createSession(options: {
  cookie: string;
  session: LolfiData['sessions'][number];
  http: ReturnType<typeof supertest.agent>;
}): Promise<{ id: string }> {
  const sessionId = options.session.id || randomInt(100, 1e6);
  const sessionName = `${options.session.name || 'Transparence annuelle'}`;

  await ingestSessions({
    ...options,
    sessions: [{ ...options.session, name: sessionName, id: sessionId }],
  });

  // The job is SUCCEEDED before the sessions are synchronised, so the session appears a moment later
  let session: { id: string } | undefined;
  await waitForExpect(async () => {
    const sessionResponse = await options.http
      .get('/api/sessions/v2/garde-des-sceaux')
      .query({ search: `${sessionName} (${sessionId})` })
      .set({ cookie: options.cookie })
      .expect(HttpStatus.OK);

    session = sessionResponse.body.items[0];
    expect(session).toBeDefined();
  }, /* timeout */ 2_000);

  return { id: assertIsDefined(session, `unknown session "${sessionName}"`).id };
}
