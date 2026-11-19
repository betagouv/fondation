import { test } from '../fixtures.ts';

test.describe('Jobs E2E', () => {
  test('lists a job canceled before it started without a start date', async ({ admin, expect, sql }) => {
    const [job] = await sql<{ id: number }[]>`
      insert into jobs.ingestion_job (ended_at, status) values (now(), 'CANCELED') returning id
    `;

    const { data } = await admin.jobs.listJobs({ query: { limit: 200, statuses: ['CANCELED'] }, throwOnError: true });

    expect(data.items.find(({ id }) => id === job!.id)).toEqual(
      expect.objectContaining({ endedAt: expect.any(String), startedAt: null }),
    );
  });
});
