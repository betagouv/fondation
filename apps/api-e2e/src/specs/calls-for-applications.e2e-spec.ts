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
        type: 'GENERAL',
      },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'ONGOING', years: ['2099'] },
      throwOnError: true,
    });
    expect(data.items.find(({ id }) => id === created.id)).toEqual({
      canChange: true,
      comment: 'Postes de présidents',
      createdOn: todayInParis(),
      deadline: { day: 15, month: 1, year: 2100 },
      history: [
        {
          action: 'CREATED',
          at: expect.any(String),
          by: { id: agent['@user']!.id, name: expect.any(String) },
          fields: [],
        },
      ],
      id: created.id,
      publishedOn: { day: 1, month: 12, year: 2099 },
      status: { id: 'UNPUBLISHED', label: 'Non publié' },
      targetLabel: "Cours d'appel et tribunaux judiciaires",
      targetPositions: [],
      type: { id: 'GENERAL', label: 'Général' },
    });
  });

  test('should list a call for the Cour de cassation with the positions it targets', async ({ agent, expect }) => {
    const { data: created } = await agent.callsForApplications.createCallForApplications({
      body: {
        publishedOn: '2096-05-04',
        targetPositions: ['COUNSELLOR', 'FIRST_PRESIDENT'],
        type: 'CCASS',
      },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'ONGOING', years: ['2096'] },
      throwOnError: true,
    });
    expect(data.items.find(({ id }) => id === created.id)).toMatchObject({
      targetLabel: 'Premier président et Conseiller',
      targetPositions: [
        { id: 'FIRST_PRESIDENT', label: 'Premier président' },
        { id: 'COUNSELLOR', label: 'Conseiller' },
      ],
      type: { id: 'CCASS', label: 'Cour de cassation' },
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

  test('should note the fields an update changed in the history of the call', async ({ agent, expect }) => {
    const form = {
      deadline: '2098-02-01',
      publishedOn: '2098-01-10',
      type: 'GENERAL',
    } as const;
    const { data: created } = await agent.callsForApplications.createCallForApplications({
      body: form,
      throwOnError: true,
    });

    await agent.callsForApplications.updateCallForApplications({
      body: { ...form, comment: 'Postes vacants', deadline: '2098-02-15' },
      path: { callId: created.id },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'ONGOING', years: ['2098'] },
      throwOnError: true,
    });
    const updated = data.items.find(({ id }) => id === created.id);
    expect(updated?.deadline).toEqual({ day: 15, month: 2, year: 2098 });
    expect(updated?.history.map(({ action, fields }) => [action, fields.map(({ id }) => id)])).toEqual([
      ['UPDATED', ['DEADLINE', 'COMMENT']],
      ['CREATED', []],
    ]);
  });

  test('should take a deleted call for applications out of the list', async ({ agent, expect }) => {
    const { data: created } = await agent.callsForApplications.createCallForApplications({
      body: { publishedOn: '2097-03-01', type: 'GENERAL' },
      throwOnError: true,
    });

    await agent.callsForApplications.deleteCallForApplications({
      path: { callId: created.id },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'ONGOING', years: ['2097'] },
      throwOnError: true,
    });
    expect(data.items.map(({ id }) => id)).not.toContain(created.id);
  });

  test('should replace the positions a call for the Cour de cassation targets and note it in its history', async ({
    agent,
    expect,
  }) => {
    const form = { publishedOn: '2095-02-01', type: 'CCASS' } as const;
    const { data: created } = await agent.callsForApplications.createCallForApplications({
      body: { ...form, targetPositions: ['COUNSELLOR'] },
      throwOnError: true,
    });

    await agent.callsForApplications.updateCallForApplications({
      body: { ...form, targetPositions: ['CHAMBER_PRESIDENT', 'COUNSELLOR'] },
      path: { callId: created.id },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'ONGOING', years: ['2095'] },
      throwOnError: true,
    });
    const updated = data.items.find(({ id }) => id === created.id);
    expect(updated?.targetPositions.map(({ id }) => id)).toEqual(['CHAMBER_PRESIDENT', 'COUNSELLOR']);
    expect(updated?.history[0]?.fields.map(({ id }) => id)).toEqual(['TARGET_POSITIONS']);
  });

  test('should list only the calls of the type picked', async ({ agent, expect }) => {
    const publishedOn = '2094-03-01';
    const { data: general } = await agent.callsForApplications.createCallForApplications({
      body: { publishedOn, type: 'GENERAL' },
      throwOnError: true,
    });
    const { data: ccass } = await agent.callsForApplications.createCallForApplications({
      body: { publishedOn, targetPositions: ['COUNSELLOR'], type: 'CCASS' },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'ONGOING', types: ['CCASS'], years: ['2094'] },
      throwOnError: true,
    });
    expect(data.items.map(({ type }) => type.id)).toEqual(data.items.map(() => 'CCASS'));
    expect(data.items.map(({ id }) => id)).toContain(ccass.id);
    expect(data.items.map(({ id }) => id)).not.toContain(general.id);
  });
});
