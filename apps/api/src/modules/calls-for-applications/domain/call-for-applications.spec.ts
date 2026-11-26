import { DateOnly } from '../../../utils/date-only';

import {
  CallForApplications,
  CallForApplicationsCreated,
  CallForApplicationsDeleted,
  CallForApplicationsUpdated,
  DeadlineBeforePublication,
  MissingTargetCourt,
  MissingTargetPosition,
  PublishedCallLocked,
  sortedCourts,
  targetCourtTypeOf,
  targetLabelOf,
  UntargetableCourt,
} from './call-for-applications';

const metadata = {
  comment: null,
  deadline: null,
  publishedOn: null,
  targetCourts: [],
  targetPositions: [],
  type: 'GENERAL',
} as const;
const NO_TARGETABLE_COURT = { targetableCourts: new Set<string>() };
const NO_VALUE = { dateAfter: null, dateBefore: null, typeAfter: null, typeBefore: null };
const AGENT = { id: 'agent', isAdmin: false };
const ADMIN = { id: 'admin', isAdmin: true };

function saved(status: 'PUBLISHED' | 'UNPUBLISHED' = 'UNPUBLISHED') {
  return CallForApplications.from({ ...metadata, id: 'call', status });
}

describe('CallForApplications', () => {
  describe('create', () => {
    it('creates the call with its comment without the surrounding spaces', () => {
      const createdOn = new DateOnly(2026, 11, 23);
      const call = CallForApplications.create({
        ...NO_TARGETABLE_COURT,
        ...metadata,
        authorId: 'author',
        comment: '  Postes de présidents  ',
        createdOn,
      });

      expect(call.messages).toEqual([
        new CallForApplicationsCreated('author', createdOn, call.id, {
          ...metadata,
          comment: 'Postes de présidents',
        }),
      ]);
    });

    it('creates the call without a comment left with spaces only', () => {
      const call = CallForApplications.create({
        ...NO_TARGETABLE_COURT,
        ...metadata,
        authorId: 'author',
        comment: '   ',
        createdOn: new DateOnly(2026, 11, 23),
      });

      expect(call.messages).toMatchObject([{ metadata: { comment: null } }]);
    });

    it('refuses a deadline before the publication', () => {
      expect(() =>
        CallForApplications.create({
          ...NO_TARGETABLE_COURT,
          ...metadata,
          authorId: 'author',
          createdOn: new DateOnly(2026, 11, 23),
          deadline: new DateOnly(2026, 11, 30),
          publishedOn: new DateOnly(2026, 12, 1),
        }),
      ).toThrow(DeadlineBeforePublication);
    });

    it('accepts a deadline on the day of the publication', () => {
      const call = CallForApplications.create({
        ...NO_TARGETABLE_COURT,
        ...metadata,
        authorId: 'author',
        createdOn: new DateOnly(2026, 11, 23),
        deadline: new DateOnly(2026, 12, 1),
        publishedOn: new DateOnly(2026, 12, 1),
      });

      expect(call.messages).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('names only the fields that changed in the order of the form', () => {
      const call = saved();
      const changed = { ...metadata, comment: 'Postes vacants', deadline: new DateOnly(2027, 1, 15) };

      call.update({ ...NO_TARGETABLE_COURT, ...changed, actor: AGENT });

      expect(call.messages).toEqual([
        new CallForApplicationsUpdated(
          'agent',
          { added: [], removed: [] },
          [
            { ...NO_VALUE, change: 'ADDED', dateAfter: new DateOnly(2027, 1, 15), field: 'DEADLINE' },
            { ...NO_VALUE, change: 'ADDED', field: 'COMMENT' },
          ],
          'call',
          changed,
          { added: [], removed: [] },
        ),
      ]);
    });

    it('tells a field emptied from a field given another value', () => {
      const call = CallForApplications.from({
        ...metadata,
        comment: 'Postes vacants',
        deadline: new DateOnly(2027, 1, 15),
        id: 'call',
        status: 'UNPUBLISHED',
      });

      call.update({ ...NO_TARGETABLE_COURT, ...metadata, actor: AGENT, comment: 'Postes créés' });

      expect(call.messages).toMatchObject([
        {
          fields: [
            { change: 'REMOVED', field: 'DEADLINE' },
            { change: 'CHANGED', field: 'COMMENT' },
          ],
        },
      ]);
    });

    it('leaves no trace when nothing changed', () => {
      const call = saved();

      call.update({ ...NO_TARGETABLE_COURT, ...metadata, actor: AGENT });

      expect(call.messages).toEqual([]);
    });

    it('refuses a deadline before the publication', () => {
      expect(() =>
        saved().update({
          ...NO_TARGETABLE_COURT,
          ...metadata,
          actor: AGENT,
          deadline: new DateOnly(2026, 11, 30),
          publishedOn: new DateOnly(2026, 12, 1),
        }),
      ).toThrow(DeadlineBeforePublication);
    });

    it('refuses an agent once the call is published', () => {
      expect(() =>
        saved('PUBLISHED').update({ ...NO_TARGETABLE_COURT, ...metadata, actor: AGENT, comment: 'Corrigé' }),
      ).toThrow(PublishedCallLocked);
    });

    it('lets an administrator change a published call', () => {
      const call = saved('PUBLISHED');

      call.update({ ...NO_TARGETABLE_COURT, ...metadata, actor: ADMIN, comment: 'Corrigé' });

      expect(call.messages).toMatchObject([{ fields: [{ change: 'ADDED', field: 'COMMENT' }] }]);
    });
  });

  describe('delete', () => {
    it('deletes an unpublished call', () => {
      const call = saved();

      call.delete(AGENT);

      expect(call.messages).toEqual([new CallForApplicationsDeleted('agent', 'call')]);
    });

    it('refuses an agent once the call is published', () => {
      expect(() => saved('PUBLISHED').delete(AGENT)).toThrow(PublishedCallLocked);
    });

    it('lets an administrator delete a published call', () => {
      const call = saved('PUBLISHED');

      call.delete(ADMIN);

      expect(call.messages).toEqual([new CallForApplicationsDeleted('admin', 'call')]);
    });
  });

  describe('a call for the Cour de cassation', () => {
    const ccass = {
      ...metadata,
      authorId: 'author',
      createdOn: new DateOnly(2026, 11, 25),
      type: 'CCASS',
    } as const;

    it('refuses a call that targets no position', () => {
      expect(() =>
        CallForApplications.create({ ...NO_TARGETABLE_COURT, ...ccass, targetPositions: [] }),
      ).toThrow(MissingTargetPosition);
    });

    it('keeps each position once, in the order of the hierarchy', () => {
      const call = CallForApplications.create({
        ...NO_TARGETABLE_COURT,
        ...ccass,
        targetPositions: ['COUNSELLOR', 'FIRST_PRESIDENT', 'COUNSELLOR'],
      });

      expect(call.messages).toMatchObject([
        { metadata: { targetPositions: ['FIRST_PRESIDENT', 'COUNSELLOR'] } },
      ]);
    });

    it('notes nothing when the positions read come back in another order', () => {
      const call = CallForApplications.from({
        ...ccass,
        id: 'call',
        status: 'UNPUBLISHED',
        targetPositions: ['COUNSELLOR', 'FIRST_PRESIDENT'],
      });

      call.update({
        ...NO_TARGETABLE_COURT,
        ...ccass,
        actor: AGENT,
        targetPositions: ['FIRST_PRESIDENT', 'COUNSELLOR'],
      });

      expect(call.messages).toEqual([]);
    });

    it('names the positions an update changed', () => {
      const call = CallForApplications.from({
        ...ccass,
        id: 'call',
        status: 'UNPUBLISHED',
        targetPositions: ['COUNSELLOR'],
      });

      call.update({
        ...NO_TARGETABLE_COURT,
        ...ccass,
        actor: AGENT,
        targetPositions: ['COUNSELLOR', 'CHAMBER_PRESIDENT'],
      });

      expect(call.messages).toMatchObject([{ fields: [{ change: 'ADDED', field: 'TARGET_POSITIONS' }] }]);
    });
  });

  describe('a specific call', () => {
    const specific = {
      ...metadata,
      authorId: 'author',
      createdOn: new DateOnly(2026, 11, 26),
      targetableCourts: new Set(['CA  AGEN', 'TJ  AUCH']),
      type: 'SPECIFIC',
    } as const;

    it('refuses a call that targets no court', () => {
      expect(() => CallForApplications.create({ ...specific, targetCourts: [] })).toThrow(MissingTargetCourt);
    });

    it('refuses a court that a call cannot target', () => {
      expect(() =>
        CallForApplications.create({ ...specific, targetCourts: ['CA  AGEN', 'TGI AUCH'] }),
      ).toThrow(UntargetableCourt);
    });

    it('keeps each court once', () => {
      const call = CallForApplications.create({
        ...specific,
        targetCourts: ['TJ  AUCH', 'CA  AGEN', 'TJ  AUCH'],
      });

      expect(call.messages).toMatchObject([{ metadata: { targetCourts: ['CA  AGEN', 'TJ  AUCH'] } }]);
    });

    it('keeps a court removed since the call targeted it', () => {
      const call = CallForApplications.from({
        ...specific,
        id: 'call',
        status: 'UNPUBLISHED',
        targetCourts: ['TSA MAMOUDZOU'],
      });

      call.update({
        ...specific,
        actor: AGENT,
        comment: 'Corrigé',
        targetCourts: ['TSA MAMOUDZOU', 'CA  AGEN'],
      });

      expect(call.messages).toMatchObject([
        {
          fields: [
            { change: 'ADDED', field: 'TARGET_COURTS' },
            { change: 'ADDED', field: 'COMMENT' },
          ],
        },
      ]);
    });

    it('notes nothing when the courts read come back in another order', () => {
      const call = CallForApplications.from({
        ...specific,
        id: 'call',
        status: 'UNPUBLISHED',
        targetCourts: ['TJ  AUCH', 'CA  AGEN'],
      });

      call.update({ ...specific, actor: AGENT, targetCourts: ['CA  AGEN', 'TJ  AUCH'] });

      expect(call.messages).toEqual([]);
    });
  });

  describe('a general call', () => {
    it('targets no position nor court whatever is sent', () => {
      const call = CallForApplications.create({
        ...metadata,
        authorId: 'author',
        createdOn: new DateOnly(2026, 11, 25),
        targetableCourts: new Set(['CA  AGEN']),
        targetCourts: ['CA  AGEN'],
        targetPositions: ['COUNSELLOR'],
      });

      expect(call.messages).toMatchObject([{ metadata: { targetCourts: [], targetPositions: [] } }]);
    });
  });
});

describe('the changes of a list of courts', () => {
  const specific = {
    ...metadata,
    targetableCourts: new Set(['CA  AGEN', 'TJ  AUCH', 'TJ  CAHORS']),
    type: 'SPECIFIC',
  } as const;
  const updated = (before: string[], after: string[]) => {
    const call = CallForApplications.from({
      ...specific,
      id: 'call',
      status: 'UNPUBLISHED',
      targetCourts: before,
    });
    call.update({ ...specific, actor: AGENT, targetCourts: after });
    return call.messages;
  };

  it.each([
    [['CA  AGEN'], ['CA  AGEN', 'TJ  AUCH'], 'ADDED'],
    [['CA  AGEN', 'TJ  AUCH'], ['CA  AGEN'], 'REMOVED'],
    [['CA  AGEN', 'TJ  AUCH'], ['CA  AGEN', 'TJ  CAHORS'], 'CHANGED'],
  ])('reads %j then %j as %s', (before, after, change) => {
    expect(updated(before, after)).toMatchObject([{ fields: [{ change, field: 'TARGET_COURTS' }] }]);
  });

  it('carries the courts added and removed for the journal', () => {
    expect(updated(['CA  AGEN', 'TJ  AUCH'], ['CA  AGEN', 'TJ  CAHORS'])).toMatchObject([
      { courts: { added: ['TJ  CAHORS'], removed: ['TJ  AUCH'] } },
    ]);
  });
});

describe('targetLabelOf', () => {
  it('lists the positions of a call for the Cour de cassation', () => {
    expect(
      targetLabelOf({ targetCourts: [], targetPositions: ['FIRST_PRESIDENT', 'COUNSELLOR'], type: 'CCASS' }),
    ).toBe('Premier président et Conseiller');
  });

  it('names the courts of appeal and the judicial courts for a general call', () => {
    expect(targetLabelOf({ targetCourts: [], targetPositions: [], type: 'GENERAL' })).toBe(
      "Cours d'appel et tribunaux judiciaires",
    );
  });

  it('lists the courts of a specific call', () => {
    expect(
      targetLabelOf({
        targetCourts: [{ label: "Cour d'appel d'Agen" }, { label: "Tribunal judiciaire d'Auch" }],
        targetPositions: [],
        type: 'SPECIFIC',
      }),
    ).toBe("Cour d'appel d'Agen et Tribunal judiciaire d'Auch");
  });

  it('names the first three courts and counts the others', () => {
    expect(
      targetLabelOf({
        targetCourts: ['A', 'B', 'C', 'D', 'E'].map((label) => ({ label })),
        targetPositions: [],
        type: 'SPECIFIC',
      }),
    ).toBe('A, B, C et 2 autres');
  });

  it('names a fourth court rather than counting a single other', () => {
    expect(
      targetLabelOf({
        targetCourts: ['A', 'B', 'C', 'D'].map((label) => ({ label })),
        targetPositions: [],
        type: 'SPECIFIC',
      }),
    ).toBe('A, B, C et D');
  });
});

describe('targetCourtTypeOf', () => {
  it.each([
    ['CA', 'COURT_OF_APPEAL'],
    ['TSA', 'COURT_OF_APPEAL'],
    ['TJ', 'JUDICIAL_COURT'],
    ['TPI', 'JUDICIAL_COURT'],
  ])('groups a court of type %s under %s', (typeJur, type) => {
    expect(targetCourtTypeOf(typeJur)).toBe(type);
  });
});

describe('sortedCourts', () => {
  it('puts the courts of appeal first and then sorts each group by city', () => {
    const court = (codejur: string, typeJur: string, ville_jur: string) => ({
      codejur,
      libelle: null,
      typeJur,
      ville_jur,
    });

    expect(
      sortedCourts([
        court('TJ  AUCH', 'TJ', 'AUCH'),
        court('TSA SAINT PIERRE ET MIQUELON', 'TSA', 'SAINT PIERRE ET MIQUELON'),
        court('TPI NOUMEA', 'TPI', 'NOUMEA'),
        court('CA  AGEN', 'CA', 'AGEN'),
      ]).map(({ codejur }) => codejur),
    ).toEqual(['CA  AGEN', 'TSA SAINT PIERRE ET MIQUELON', 'TJ  AUCH', 'TPI NOUMEA']);
  });
});
