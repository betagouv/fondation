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

let sessionIdSequence = randomInt(1_000_000, 1_000_000_000);

export async function createSession(options: {
  cookie: string;
  http: ReturnType<typeof supertest.agent>;
  session: LolfiData['sessions'][number];
}): Promise<{ id: string }> {
  const sessionId = options.session.id || ++sessionIdSequence;
  const sessionName = `${options.session.name || 'Transparence annuelle'}`;
  const archive = await generateLolfiArchive({
    sessions: [{ ...options.session, id: sessionId, name: sessionName }],
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

  let session: { id: string } | undefined;
  await waitForExpect(async () => {
    const sessionResponse = await options.http
      .get('/api/sessions/v2/garde-des-sceaux')
      .query({ search: `${sessionName} (${sessionId})` })
      .set({ cookie: options.cookie })
      .expect(HttpStatus.OK);

    session = sessionResponse.body.items[0];
    expect(session).toBeDefined();
  });

  return { id: assertIsDefined(session, `unknown session "${sessionName}"`).id };
}
