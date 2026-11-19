import { test } from '../fixtures.ts';

test.describe('Jobs E2E', () => {
  test('lists a job not started yet without dates', async ({ admin, expect, sql }) => {
    const [job] = await sql<{ id: number }[]>`
      insert into jobs.ingestion_job (status) values ('IDLE') returning id
    `;

    const { data } = await admin.jobs.listJobs({ query: { limit: 200, statuses: ['IDLE'] }, throwOnError: true });

    expect(data.items.find(({ id }) => id === job!.id)).toEqual(
      expect.objectContaining({ endedAt: null, startedAt: null }),
    );
  });
});
