import { test } from '../fixtures.ts';
import { jurisdictions } from '../utils/seed.ts';

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
      query: { limit: 200, period: 'ONGOING', sortBy: 'createdOn', sortDesc: 'true', years: ['2099'] },
      throwOnError: true,
    });
    expect(data.items.find(({ id }) => id === created.id)).toEqual({
      canChange: true,
      comment: 'Postes de présidents',
      createdOn: todayInParis(),
      deadline: { day: 15, month: 1, year: 2100 },
      guidelinesAdaptations: [],
      history: [
        {
          action: 'CREATED',
          at: expect.any(String),
          by: { id: agent['@user']!.id, name: expect.any(String) },
          changes: [],
        },
      ],
      id: created.id,
      publishedOn: { day: 1, month: 12, year: 2099 },
      status: { id: 'UNPUBLISHED', label: 'Non publié' },
      targetCourts: [],
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
      query: { limit: 200, period: 'ONGOING', sortBy: 'createdOn', sortDesc: 'true', years: ['2096'] },
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

  test('should offer the courts of appeal and the judicial courts a specific call can target', async ({
    agent,
    expect,
  }) => {
    const { data } = await agent.callsForApplications.findCallForApplicationsForm({ throwOnError: true });

    const courtsOf = (typeId: string) => data.targetCourtTypes.find(({ type }) => type.id === typeId)?.courts;
    expect(courtsOf('COURT_OF_APPEAL')).toContainEqual({ ...jurisdictions['CA  LYON'], type: 'COURT_OF_APPEAL' });
    expect(data.targetCourtTypes.flatMap(({ courts }) => courts)).not.toContainEqual(
      expect.objectContaining({ id: 'CC  PARIS' }),
    );
    expect(courtsOf('JUDICIAL_COURT')).toContainEqual({
      id: jurisdictions['TJ  GRASSE'].id,
      label: jurisdictions['TJ  GRASSE'].label,
      type: 'JUDICIAL_COURT',
    });
  });

  test('should name for each type of court the adaptation of the guidelines a specific call may make', async ({
    agent,
    expect,
  }) => {
    const { data } = await agent.callsForApplications.findCallForApplicationsForm({ throwOnError: true });

    expect(data.targetCourtTypes.map(({ guidelinesAdaptationLabel }) => guidelinesAdaptationLabel)).toEqual([
      "Adaptation aux lignes directrices de gestion sur la durée d'affectation du poste actuel pour les cours d'appel",
      "Adaptation aux lignes directrices de gestion sur la durée d'affectation du poste actuel pour les tribunaux judiciaires",
    ]);
  });

  test('should name each type of court within a sentence', async ({ agent, expect }) => {
    const { data } = await agent.callsForApplications.findCallForApplicationsForm({ throwOnError: true });

    expect(data.targetCourtTypes.map(({ typeInSentence }) => typeInSentence)).toEqual([
      "cours d'appel",
      'tribunaux judiciaires',
    ]);
  });

  test('should list a specific call with the courts it targets', async ({ agent, expect }) => {
    const { data: created } = await agent.callsForApplications.createCallForApplications({
      body: { publishedOn: '2093-06-01', targetCourts: ['TJ  GRASSE', 'CA  LYON'], type: 'SPECIFIC' },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'ONGOING', sortBy: 'createdOn', sortDesc: 'true', years: ['2093'] },
      throwOnError: true,
    });
    expect(data.items.find(({ id }) => id === created.id)).toMatchObject({
      targetCourts: [
        { ...jurisdictions['CA  LYON'], type: 'COURT_OF_APPEAL' },
        { id: 'TJ  GRASSE', label: 'Tribunal judiciaire de Grasse', type: 'JUDICIAL_COURT' },
      ],
      targetLabel: "Cour d'appel de Lyon et Tribunal judiciaire de Grasse",
      type: { id: 'SPECIFIC', label: 'Spécifique' },
    });
  });

  test('should keep the adaptation of the guidelines a specific call makes for a type of court', async ({
    agent,
    expect,
  }) => {
    const { data: created } = await agent.callsForApplications.createCallForApplications({
      body: {
        guidelinesAdaptations: ['JUDICIAL_COURT'],
        publishedOn: '2091-06-01',
        targetCourts: ['TJ  GRASSE', 'CA  LYON'],
        type: 'SPECIFIC',
      },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'ONGOING', sortBy: 'createdOn', sortDesc: 'true', years: ['2091'] },
      throwOnError: true,
    });
    expect(data.items.find(({ id }) => id === created.id)?.guidelinesAdaptations).toEqual([
      { id: 'JUDICIAL_COURT', label: 'Tribunaux judiciaires' },
    ]);
  });

  test('should note in the history of a specific call the adaptation of the guidelines turned on', async ({
    agent,
    expect,
  }) => {
    const form = { publishedOn: '2090-02-01', targetCourts: ['CA  LYON'], type: 'SPECIFIC' as const };
    const { data: created } = await agent.callsForApplications.createCallForApplications({
      body: form,
      throwOnError: true,
    });

    await agent.callsForApplications.updateCallForApplications({
      body: { ...form, guidelinesAdaptations: ['COURT_OF_APPEAL'] },
      path: { callId: created.id },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'ONGOING', sortBy: 'createdOn', sortDesc: 'true', years: ['2090'] },
      throwOnError: true,
    });
    expect(data.items.find(({ id }) => id === created.id)?.history[0]?.changes).toEqual([
      {
        change: { id: 'ADDED', label: 'ajouté' },
        label:
          "l'adaptation aux lignes directrices de gestion sur la durée d'affectation du poste actuel pour les cours d'appel",
        targets: null,
      },
    ]);
  });

  test('should replace the courts a specific call targets and note it in its history', async ({ agent, expect }) => {
    const form = { publishedOn: '2092-02-01', type: 'SPECIFIC' } as const;
    const { data: created } = await agent.callsForApplications.createCallForApplications({
      body: { ...form, targetCourts: ['CA  LYON'] },
      throwOnError: true,
    });

    await agent.callsForApplications.updateCallForApplications({
      body: { ...form, targetCourts: ['TJ  GRASSE'] },
      path: { callId: created.id },
      throwOnError: true,
    });

    const { data } = await agent.callsForApplications.listCallsForApplications({
      query: { limit: 200, period: 'ONGOING', sortBy: 'createdOn', sortDesc: 'true', years: ['2092'] },
      throwOnError: true,
    });
    const updated = data.items.find(({ id }) => id === created.id);
    expect(updated?.targetCourts.map(({ id }) => id)).toEqual(['TJ  GRASSE']);
    expect(updated?.history[0]?.changes).toEqual([
      {
        change: { id: 'ADDED', label: 'ajouté' },
        label: 'le tribunal judiciaire de Grasse',
        targets: null,
      },
      {
        change: { id: 'REMOVED', label: 'retiré' },
        label: "la cour d'appel de Lyon",
        targets: null,
      },
    ]);
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
      query: { limit: 200, period: 'PAST', sortBy: 'createdOn', sortDesc: 'true', years: ['2001'] },
      throwOnError: true,
    });
    expect(data.items.map(({ id }) => id)).toContain(created.id);
    expect(data.years).toContain(2001);
  });

  test('should note in the history of the call what an update did to each field', async ({ agent, expect }) => {
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
      query: { limit: 200, period: 'ONGOING', sortBy: 'createdOn', sortDesc: 'true', years: ['2098'] },
      throwOnError: true,
    });
    const updated = data.items.find(({ id }) => id === created.id);
    expect(updated?.deadline).toEqual({ day: 15, month: 2, year: 2098 });
    expect(updated?.history[0]).toMatchObject({
      action: 'UPDATED',
      changes: [
        {
          change: { id: 'CHANGED', label: 'modifié' },
          label: 'la date limite du 01/02/2098 au 15/02/2098',
          targets: null,
        },
        {
          change: { id: 'ADDED', label: 'ajouté' },
          label: 'un commentaire',
          targets: null,
        },
      ],
    });
    expect(updated?.history[1]).toMatchObject({ action: 'CREATED', changes: [] });
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
      query: { limit: 200, period: 'ONGOING', sortBy: 'createdOn', sortDesc: 'true', years: ['2097'] },
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
      query: { limit: 200, period: 'ONGOING', sortBy: 'createdOn', sortDesc: 'true', years: ['2095'] },
      throwOnError: true,
    });
    const updated = data.items.find(({ id }) => id === created.id);
    expect(updated?.targetPositions.map(({ id }) => id)).toEqual(['CHAMBER_PRESIDENT', 'COUNSELLOR']);
    expect(updated?.history[0]?.changes).toEqual([
      {
        change: { id: 'ADDED', label: 'ajouté' },
        label: 'le président de chambre aux postes cibles',
        targets: null,
      },
    ]);
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
      query: {
        limit: 200,
        period: 'ONGOING',
        sortBy: 'createdOn',
        sortDesc: 'true',
        types: ['CCASS'],
        years: ['2094'],
      },
      throwOnError: true,
    });
    expect(data.items.map(({ type }) => type.id)).toEqual(data.items.map(() => 'CCASS'));
    expect(data.items.map(({ id }) => id)).toContain(ccass.id);
    expect(data.items.map(({ id }) => id)).not.toContain(general.id);
  });
});
