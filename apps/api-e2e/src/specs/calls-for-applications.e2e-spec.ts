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
        deadline: '2100-01-15',
        publishedOn: '2099-12-01',
        targetJurisdictionType: 'JUDICIAL_COURT',
        type: 'GENERAL',
      },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'ONGOING', years: ['2099'] },
      throwOnError: true,
    });
    expect(data.items.find(({ id }) => id === created.id)).toEqual({
      createdOn: todayInParis(),
      deadline: { day: 15, month: 1, year: 2100 },
      history: [
        {
          action: { id: 'CREATED', label: 'Créé' },
          at: expect.any(String),
          by: { id: agent['@user']!.id, name: expect.any(String) },
        },
      ],
      id: created.id,
      publishedOn: { day: 1, month: 12, year: 2099 },
      status: { id: 'UNPUBLISHED', label: 'Non publié' },
      targetJurisdictionType: { id: 'JUDICIAL_COURT', label: 'TJ' },
      type: { id: 'GENERAL', label: 'Général' },
    });
  });

  test('should list a call for applications in the past ones of its year once its deadline is over', async ({
    agent,
    expect,
  }) => {
    const { data: created } = await agent.callsForApplications.createCallForApplications({
      body: {
        deadline: '2001-02-10',
        publishedOn: '2001-01-10',
        targetJurisdictionType: 'COURT_OF_APPEAL',
        type: 'GENERAL',
      },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'PAST', years: ['2001'] },
      throwOnError: true,
    });
    expect(data.items.map(({ id }) => id)).toContain(created.id);
    expect(data.years).toContain(2001);
  });
});
