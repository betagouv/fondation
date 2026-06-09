import { randomInt } from 'node:crypto';

import { HttpStatus } from '@nestjs/common';
import supertest from 'supertest';
import waitForExpect from 'wait-for-expect';

import { generateLolfiArchive, type LolfiData } from 'lolfi';

import { PrismaJobStatusEnum } from '../../src/generated/prisma/enums';
import { FILE_MIME_TYPES } from '../../src/modules/framework/files';
import { IngestedLolfiArchiveDto } from '../../src/modules/ingest/infrastructure/ingest.dto';
import { DetailedJobDto } from '../../src/modules/ingest/jobs/queries/details-job.query';
import { assertIsDefined } from '../../src/utils/is-defined';

export async function createSession(options: {
  cookie: string;
  session: LolfiData['sessions'][number];
  http: ReturnType<typeof supertest.agent>;
}): Promise<{ id: string }> {
  const sessionId = options.session.id || randomInt(100, 1e6);
  const sessionName = `${options.session.name || 'Transparence annuelle'}`;

  const archive = await generateLolfiArchive({
    sessions: [{ ...options.session, name: sessionName, id: sessionId }],
  });

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
    const jobResponse = await options.http
      .get(`/api/jobs/v1/${jobId}`)
      .set({ cookie: options.cookie })
      .expect(HttpStatus.OK);

    const status: PrismaJobStatusEnum = (jobResponse.body as DetailedJobDto).status;
    if (status === 'FAILED') {
      console.error((jobResponse.body as DetailedJobDto).errors);
      console.error((jobResponse.body as DetailedJobDto).files.map((file) => file.errors));
      expect(status).toBe('FAILED');
    }

    expect(status).toBe('SUCCEEDED' satisfies PrismaJobStatusEnum);
  }, /* timeout */ 2_000);

  const sessionResponse = await options.http
    .get('/api/sessions/v2/garde-des-sceaux')
    .query({ search: `${sessionName} (${sessionId})` })
    .set({ cookie: options.cookie })
    .expect(HttpStatus.OK);

  return { id: assertIsDefined(sessionResponse.body.items[0], `unknown session "${sessionName}"`).id };
}
