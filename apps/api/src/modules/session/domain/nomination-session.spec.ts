import { randomUUID } from 'node:crypto';

import { Magistrat, PrioriteEnum, TypeDeSaisine } from 'shared-models';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { LodamNominationFile } from './nomination-file';
import {
  NominationFileOutcome,
  NominationFileOutcomeEnum,
} from './nomination-file-outcome';
import {
  LodamNominationSessionFilesCreated,
  NominationFileOutcomeDefined,
  NominationFilesHaveOutcome,
  NominationSession,
  NominationSessionAffectationHasUnknownReporter,
  NominationSessionAffectationVersionCreated,
  NominationSessionAffectationVersionPublished,
  NominationSessionCreated,
  NominationSessionFileCommentAccessGranted,
  NominationSessionFilePrioritiesUpdated,
  NominationSessionFileReportersAffected,
  NominationSessionFilesObserversUpdated,
  NominationSessionIndicatorRemoved,
  NominationSessionValidated,
  NonFormationMemberDefinedAsReporter,
  UnknownNominationFiles,
} from './nomination-session';

describe('NominationSession', () => {
  it('should affect reporters to nomination files', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFileIdsWithOutcome: new Set(),
    });

    session.affectNominationFileReporters({
      formationMemberIds: new Set(['reporter-1', 'reporter-2']),
      affectations: [
        {
          nominationFileId: 'nomination-file-id-1',
          reporterIds: ['reporter-1', 'reporter-2'],
        },
      ],
    });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionFileReportersAffected('session-id', 'version-id', [
        {
          nominationFileId: 'nomination-file-id-1',
          reporterIds: ['reporter-1', 'reporter-2'],
        },
      ]),
    ]);
  });

  it('should throw when trying to affect on files with outcome', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFileIdsWithOutcome: new Set(['nomination-file-id-1']),
    });

    expect(() =>
      session.affectNominationFileReporters({
        formationMemberIds: new Set(['reporter-1', 'reporter-2']),
        affectations: [
          {
            nominationFileId: 'nomination-file-id-1',
            reporterIds: ['reporter-1', 'reporter-2'],
          },
        ],
      }),
    ).toThrow(NominationFilesHaveOutcome);
  });

  it('should create a new version when the version is already published', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: false },
      nominationFileIdsWithOutcome: new Set(),
    });

    session.affectNominationFileReporters({
      formationMemberIds: new Set(['reporter-1', 'reporter-2']),
      affectations: [
        {
          nominationFileId: 'nomination-file-id-1',
          reporterIds: ['reporter-1', 'reporter-2'],
        },
      ],
    });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionAffectationVersionCreated('session-id', {
        id: expect.any(String),
        version: 4,
      }),
      new NominationSessionFileReportersAffected(
        'session-id',
        expect.any(String),
        [
          {
            nominationFileId: 'nomination-file-id-1',
            reporterIds: ['reporter-1', 'reporter-2'],
          },
        ],
      ),
    ]);
  });

  it('should throw when trying to affect a non formation member', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFileIdsWithOutcome: new Set(),
    });

    expect(() =>
      session.affectNominationFileReporters({
        formationMemberIds: new Set(['reporter-1']),
        affectations: [
          {
            nominationFileId: 'nomination-file-id-1',
            reporterIds: ['reporter-1', 'reporter-2'],
          },
        ],
      }),
    ).toThrow(NonFormationMemberDefinedAsReporter);
  });

  it('should define a nomination file priority', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFileIdsWithOutcome: new Set(),
    });

    session.setNominationFilePriority({
      nominationFileId: 'nomination-file-id-1',
      priorities: [PrioriteEnum.OUTRE_MER],
    });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionFilePrioritiesUpdated(
        'session-id',
        'nomination-file-id-1',
        [PrioriteEnum.OUTRE_MER],
      ),
    ]);
  });

  it('should throw when defining a priority on a file with outcome', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFileIdsWithOutcome: new Set(['nomination-file-id-1']),
    });

    expect(() =>
      session.setNominationFilePriority({
        nominationFileId: 'nomination-file-id-1',
        priorities: [PrioriteEnum.OUTRE_MER],
      }),
    ).toThrow(NominationFilesHaveOutcome);
  });

  it('should unset a nomination file priority', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFileIdsWithOutcome: new Set(),
    });

    session.setNominationFilePriority({
      nominationFileId: 'nomination-file-id-1',
      priorities: [],
    });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionFilePrioritiesUpdated(
        'session-id',
        'nomination-file-id-1',
        [],
      ),
    ]);
  });

  it('should publish a draft version', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFileIdsWithOutcome: new Set(),
    });

    session.publishAffectationVersion({ userId: 'user-id' });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionAffectationVersionPublished(
        'session-id',
        'version-id',
        'user-id',
      ),
    ]);
  });

  it('should NOT publish a published version', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: false },
      nominationFileIdsWithOutcome: new Set(),
    });

    session.publishAffectationVersion({ userId: 'user-id' });

    const { messages } = session;
    expect(messages).toEqual([]);
  });

  it('should publish an unknown version', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFileIdsWithOutcome: new Set(),
    });

    session.publishAffectationVersion({ userId: 'user-id' });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionAffectationVersionPublished(
        'session-id',
        undefined,
        'user-id',
      ),
    ]);
  });

  it('should grant comment access to users', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFileIdsWithOutcome: new Set(),
    });

    session.grantCommentAccess({
      formationMemberIds: new Set(['user-1', 'user-2']),
      nominationFileId: 'nomination-file-id-1',
      userIds: ['user-1', 'user-2'],
    });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionFileCommentAccessGranted(
        'session-id',
        'nomination-file-id-1',
        ['user-1', 'user-2'],
      ),
    ]);
  });

  it('should grant comment access with empty user list', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFileIdsWithOutcome: new Set(),
    });

    session.grantCommentAccess({
      formationMemberIds: new Set<string>(),
      nominationFileId: 'nomination-file-id-1',
      userIds: [],
    });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionFileCommentAccessGranted(
        'session-id',
        'nomination-file-id-1',
        [],
      ),
    ]);
  });

  it('should throw when trying to grant comment access to non formation members', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFileIdsWithOutcome: new Set(),
    });

    expect(() =>
      session.grantCommentAccess({
        formationMemberIds: new Set(['user-1']),
        nominationFileId: 'nomination-file-id-1',
        userIds: ['user-1', 'user-2'],
      }),
    ).toThrow(NonFormationMemberDefinedAsReporter);
  });

  describe('NominationSession tree creation (LODAM)', () => {
    it('should create a nomination session tree', () => {
      const session =
        NominationSession.createLodamNominationTreeAndAffectMembers({
          name: 'TEST transparence LODAM PARQUET',
          date: new DateOnly(2025, 1, 1),
          observationClosingDate: new DateOnly(2025, 2, 1),
          formation: Magistrat.Formation.PARQUET,
          typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
          dueDate: null,
          positionStartDate: null,
          userId: randomUUID(),

          // prettier-ignore
          formationMembers: [{ fullName: 'BOURDIEU Pierre', id: '51176c69-4f03-4973-9d25-0f83c7ad6931' }],
          // prettier-ignore
          files: [
          { fileNumber: 1, name: 'ARENDT HANNAH', reporters: ['BOURDIEU Pierre'], grade: Magistrat.Grade.HH, targetedGrade: Magistrat.Grade.HH, targetedPosition: 'Procureur de la République TJ GRASSE', currentPosition: 'Procureur de la République TJ NARBONNE', lastPositionDate: new DateOnly(2020, 9, 1), lastRankingDate: new DateOnly(2010, 12, 17), rank: '(10 sur une liste de 12)', biography: null, birthDate: new DateOnly(1968, 4, 9), careerInformation: null, observers: [] },
          { fileNumber: 2, name: 'GRAMSCI ANTONIO', reporters: ['BOURDIEU Pierre'], grade: Magistrat.Grade.I, targetedGrade: Magistrat.Grade.I, targetedPosition: 'Vice-président TJ  CAHORS', currentPosition: 'Juge TJ  SAINT PIERRE DE LA REUNION', lastPositionDate: new DateOnly(2019, 9, 1), lastRankingDate: new DateOnly(2019, 12, 7), rank: '(2 sur une liste de 2)', biography: null, birthDate: new DateOnly(1991, 12, 23), careerInformation: null, observers: [] }
        ],
        });

      expect(session.messages[0]).toEqual(
        new NominationSessionCreated(
          session.id,
          'TEST transparence LODAM PARQUET',
          TypeDeSaisine.TRANSPARENCE_GDS,
          Magistrat.Formation.PARQUET,
          new DateOnly(2025, 1, 1),
          new DateOnly(2025, 2, 1),
          null,
          null,
          null,
        ),
      );

      expect(session.messages[1]).toEqual(
        new NominationSessionValidated(session.id, expect.any(String)),
      );

      expect(session.messages[1]).toEqual(
        new NominationSessionIndicatorRemoved(session.id, expect.any(String)),
      );

      expect(session.messages[3]).toEqual(
        new LodamNominationSessionFilesCreated(
          session.id,
          // prettier-ignore
          [
            { id: expect.any(String), fileNumber: 1, name: 'ARENDT HANNAH', reporters: ['BOURDIEU Pierre'], grade: Magistrat.Grade.HH, targetedGrade: Magistrat.Grade.HH, targetedPosition: 'Procureur de la République TJ GRASSE', currentPosition: 'Procureur de la République TJ NARBONNE', lastPositionDate: new DateOnly(2020, 9, 1), lastRankingDate: new DateOnly(2010, 12, 17), rank: '(10 sur une liste de 12)', biography: null, birthDate: new DateOnly(1968, 4, 9), careerInformation: null, observers: [] },
            { id: expect.any(String), fileNumber: 2, name: 'GRAMSCI ANTONIO', reporters: ['BOURDIEU Pierre'], grade: Magistrat.Grade.I, targetedGrade: Magistrat.Grade.I, targetedPosition: 'Vice-président TJ  CAHORS', currentPosition: 'Juge TJ  SAINT PIERRE DE LA REUNION', lastPositionDate: new DateOnly(2019, 9, 1), lastRankingDate: new DateOnly(2019, 12, 7), rank: '(2 sur une liste de 2)', biography: null, birthDate: new DateOnly(1991, 12, 23), careerInformation: null, observers: [] }
          ],
        ),
      );

      expect(session.messages[4]).toEqual(
        new NominationSessionFileReportersAffected(
          session.id,
          null,
          // prettier-ignore
          [
            { nominationFileId: expect.any(String), reporterIds: ['51176c69-4f03-4973-9d25-0f83c7ad6931'] },
            { nominationFileId: expect.any(String), reporterIds: ['51176c69-4f03-4973-9d25-0f83c7ad6931'] }
          ],
        ),
      );
    });

    it('should throw, when affecting an unknown reporter', () => {
      const act = () =>
        NominationSession.createLodamNominationTreeAndAffectMembers({
          name: 'TEST transparence LODAM PARQUET',
          date: new DateOnly(2025, 1, 1),
          observationClosingDate: new DateOnly(2025, 2, 1),
          formation: Magistrat.Formation.PARQUET,
          typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
          dueDate: null,
          positionStartDate: null,
          userId: randomUUID(),

          // prettier-ignore
          formationMembers: [],
          // prettier-ignore
          files: [
            { fileNumber: 1, reporters: ['BOURDIEU Pierre'] },
            { fileNumber: 2, reporters: ['BOURDIEU Pierre'] }
          ] as LodamNominationFile[],
        });

      expect(act).toThrow(NominationSessionAffectationHasUnknownReporter);
      expect(act).toThrow(
        expect.objectContaining({
          errors: [
            { fileNumber: 1, reporters: ['BOURDIEU Pierre'] },
            { fileNumber: 2, reporters: ['BOURDIEU Pierre'] },
          ],
        }),
      );
    });
  });

  it('should update observers', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFileIdsWithOutcome: new Set(),
    });

    session.updateNominationFileObservers({
      existingNominationFiles: [{ id: 'nf-1', fileNumber: 1 }],
      nominationFiles: [{ fileNumber: 1, observers: ['BOURDIEU Pierre'] }],
    });

    const [message] = session.messages;
    expect(message).toEqual(
      new NominationSessionFilesObserversUpdated(session.id, [
        { id: 'nf-1', observers: ['BOURDIEU Pierre'] },
      ]),
    );
  });

  it('should throw when updating observers, but file number is unknown', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFileIdsWithOutcome: new Set(),
    });

    expect(() =>
      session.updateNominationFileObservers({
        existingNominationFiles: [],
        nominationFiles: [{ fileNumber: 1, observers: ['BOURDIEU Pierre'] }],
      }),
    ).toThrow(new UnknownNominationFiles([1]));
  });

  it('should throw when updating observers on files with outcome', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFileIdsWithOutcome: new Set(['nomination-file-id-1']),
    });

    expect(() =>
      session.updateNominationFileObservers({
        nominationFiles: [{ fileNumber: 1, observers: ['BOURDIEU Pierre'] }],
        existingNominationFiles: [
          { id: 'nomination-file-id-1', fileNumber: 1 },
        ],
      }),
    ).toThrow(NominationFilesHaveOutcome);
  });

  it('should define the nomination file outcome', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFileIdsWithOutcome: new Set(),
    });

    session.defineNominationFileOutcome({
      nominationFileId: 'nomination-file-id-1',
      outcome: NominationFileOutcome.from({
        outcome: 'VALIDATED' satisfies NominationFileOutcomeEnum,
        comment: null,
      }),
    });

    const messages = session.messages;
    expect(messages).toEqual([
      new NominationFileOutcomeDefined(
        'nomination-file-id-1',
        'VALIDATED',
        null,
      ),
    ]);
  });

  it('should define another nomination file outcome', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFileIdsWithOutcome: new Set(['nomination-file-id-1']),
    });

    session.defineNominationFileOutcome({
      nominationFileId: 'nomination-file-id-1',
      outcome: NominationFileOutcome.from({
        outcome: 'WITHDRAWN' satisfies NominationFileOutcomeEnum,
        comment: null,
      }),
    });

    const messages = session.messages;
    expect(messages).toEqual([
      new NominationFileOutcomeDefined(
        'nomination-file-id-1',
        'WITHDRAWN',
        null,
      ),
    ]);
  });

  it('should reset the nomination file outcome', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFileIdsWithOutcome: new Set(['nomination-file-id-1']),
    });

    session.defineNominationFileOutcome({
      nominationFileId: 'nomination-file-id-1',
      outcome: null,
    });

    const messages = session.messages;
    expect(messages).toEqual([
      new NominationFileOutcomeDefined('nomination-file-id-1', null, null),
    ]);
  });
});
