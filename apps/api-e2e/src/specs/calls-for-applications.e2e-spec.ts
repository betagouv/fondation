import { test } from '../fixtures.ts';

/** the day in Paris, which the API gives as the creation date */
function todayInParis() {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' })
    .format(new Date())
    .split('-')
    .map(Number);
  return { day, month, year };
}

test.describe('Calls for applications E2E', () => {
  test('should list a general call for applications once created, dated today, unpublished and signed by its author', async ({
    agent,
    expect,
  }) => {
    const { data: created } = await agent.callsForApplications.createCallForApplications({
      body: {
        comment: 'Postes de présidents',
        deadline: '2027-01-15',
        publishedOn: '2026-12-01',
        targetJurisdictionType: 'JUDICIAL_COURT',
        type: 'GENERAL',
      },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200 },
      throwOnError: true,
    });
    expect(data.items.find(({ id }) => id === created.id)).toEqual({
      createdOn: todayInParis(),
      deadline: { day: 15, month: 1, year: 2027 },
      id: created.id,
      lastChange: { at: expect.any(String), by: { id: agent['@user']!.id, name: expect.any(String) } },
      publishedOn: { day: 1, month: 12, year: 2026 },
      status: { id: 'UNPUBLISHED', label: 'Non publié' },
      targetJurisdictionType: { id: 'JUDICIAL_COURT', label: 'TJ' },
      type: { id: 'GENERAL', label: 'Général' },
    });
  });
});
