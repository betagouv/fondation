import { randomUUID } from 'node:crypto';

import { Magistrat, PrioriteEnum, TypeDeSaisine } from 'shared-models';

import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';

import { LodamNominationFile } from './nomination-file';
import { NominationFileOutcome, NominationFileOutcomeEnum } from './nomination-file-outcome';
import {
  CantUpdateNominationFiles,
  LodamNominationSessionFilesCreated,
  NominationFileAttachmentAdded,
  NominationFileAttachmentRemoved,
  NominationFileOutcomeDefined,
  NominationSession,
  NominationSessionAffectationHasUnknownReporter,
  NominationSessionAffectationVersionCreated,
  NominationSessionAffectationVersionPublished,
  NominationSessionCreated,
  NominationSessionFilePrioritiesUpdated,
  NominationSessionFileReportersAffected,
  NominationSessionFilesObserversUpdated,
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
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: null,
          docs: [],
        },
      ],
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

  it('should throw when trying to affect on files linked to docs', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: 'VALIDATED',
          docs: [
            {
              agenda: { id: 'a1', outcome: 'SUSPENDED' },
              officialReport: { id: 'or1', outcome: 'VALIDATED' },
            },
          ],
        },
      ],
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
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should create a new version when the version is already published', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: false },
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: null,
          docs: [],
        },
      ],
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
      new NominationSessionFileReportersAffected('session-id', expect.any(String), [
        {
          nominationFileId: 'nomination-file-id-1',
          reporterIds: ['reporter-1', 'reporter-2'],
        },
      ]),
    ]);
  });

  it('should throw when trying to affect a non formation member', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: null,
          docs: [],
        },
      ],
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
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: null,
          docs: [],
        },
      ],
    });

    session.setNominationFilePriority({
      nominationFileId: 'nomination-file-id-1',
      priorities: [PrioriteEnum.OUTRE_MER],
    });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionFilePrioritiesUpdated('session-id', 'nomination-file-id-1', [
        PrioriteEnum.OUTRE_MER,
      ]),
    ]);
  });

  it('should throw when defining a priority on a file linked to docs', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: 'VALIDATED',
          docs: [
            {
              agenda: { id: 'a1', outcome: 'SUSPENDED' },
              officialReport: { id: 'or-1', outcome: 'VALIDATED' },
            },
          ],
        },
      ],
    });

    expect(() =>
      session.setNominationFilePriority({
        nominationFileId: 'nomination-file-id-1',
        priorities: [PrioriteEnum.OUTRE_MER],
      }),
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should unset a nomination file priority', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: null,
          docs: [],
        },
      ],
    });

    session.setNominationFilePriority({
      nominationFileId: 'nomination-file-id-1',
      priorities: [],
    });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionFilePrioritiesUpdated('session-id', 'nomination-file-id-1', []),
    ]);
  });

  it('should publish a draft version', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: true },
      nominationFiles: [],
    });

    session.publishAffectationVersion({ userId: 'user-id' });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionAffectationVersionPublished('session-id', 'version-id', 'user-id'),
    ]);
  });

  it('should NOT publish a published version', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: { id: 'version-id', version: 3, isDraft: false },
      nominationFiles: [],
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
      nominationFiles: [],
    });

    session.publishAffectationVersion({ userId: 'user-id' });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionAffectationVersionPublished('session-id', undefined, 'user-id'),
    ]);
  });

  describe('NominationSession tree creation (LODAM)', () => {
    it('should create a nomination session tree', () => {
      const session = NominationSession.createLodamNominationTreeAndAffectMembers({
        name: 'TEST transparence LODAM PARQUET',
        date: new DateOnly(2025, 1, 1),
        observationClosingDate: new DateOnly(2025, 2, 1),
        formation: Magistrat.Formation.PARQUET,
        typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
        dueDate: null,
        positionStartDate: null,
        userId: randomUUID(),

        // oxfmt-ignore
        formationMembers: [{ fullName: 'BOURDIEU Pierre', id: '51176c69-4f03-4973-9d25-0f83c7ad6931' }],
        // oxfmt-ignore
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

      expect(session.messages[1]).toEqual(new NominationSessionValidated(session.id, expect.any(String)));

      expect(session.messages[2]).toEqual(
        new LodamNominationSessionFilesCreated(
          session.id,
          // oxfmt-ignore
          [
            { id: expect.any(String), fileNumber: 1, name: 'ARENDT HANNAH', reporters: ['BOURDIEU Pierre'], grade: Magistrat.Grade.HH, targetedGrade: Magistrat.Grade.HH, targetedPosition: 'Procureur de la République TJ GRASSE', currentPosition: 'Procureur de la République TJ NARBONNE', lastPositionDate: new DateOnly(2020, 9, 1), lastRankingDate: new DateOnly(2010, 12, 17), rank: '(10 sur une liste de 12)', biography: null, birthDate: new DateOnly(1968, 4, 9), careerInformation: null, observers: [] },
            { id: expect.any(String), fileNumber: 2, name: 'GRAMSCI ANTONIO', reporters: ['BOURDIEU Pierre'], grade: Magistrat.Grade.I, targetedGrade: Magistrat.Grade.I, targetedPosition: 'Vice-président TJ  CAHORS', currentPosition: 'Juge TJ  SAINT PIERRE DE LA REUNION', lastPositionDate: new DateOnly(2019, 9, 1), lastRankingDate: new DateOnly(2019, 12, 7), rank: '(2 sur une liste de 2)', biography: null, birthDate: new DateOnly(1991, 12, 23), careerInformation: null, observers: [] }
          ],
        ),
      );

      expect(session.messages[3]).toEqual(
        new NominationSessionFileReportersAffected(
          session.id,
          null,
          // oxfmt-ignore
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

          // oxfmt-ignore
          formationMembers: [],
          // oxfmt-ignore
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
      nominationFiles: [
        {
          id: 'nf-1',
          outcome: null,
          docs: [],
        },
      ],
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
      nominationFiles: [],
    });

    expect(() =>
      session.updateNominationFileObservers({
        existingNominationFiles: [],
        nominationFiles: [{ fileNumber: 1, observers: ['BOURDIEU Pierre'] }],
      }),
    ).toThrow(new UnknownNominationFiles([1]));
  });

  it('should throw when updating observers on files linked to docs', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: 'VALIDATED',
          docs: [
            {
              agenda: { id: 'a1', outcome: 'SUSPENDED' },
              officialReport: { id: 'or-1', outcome: 'VALIDATED' },
            },
          ],
        },
      ],
    });

    expect(() =>
      session.updateNominationFileObservers({
        nominationFiles: [{ fileNumber: 1, observers: ['BOURDIEU Pierre'] }],
        existingNominationFiles: [{ id: 'nomination-file-id-1', fileNumber: 1 }],
      }),
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should define the nomination file outcome', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: null,
          docs: [],
        },
      ],
    });

    session.defineNominationFileOutcome({
      nominationFileId: 'nomination-file-id-1',
      outcome: NominationFileOutcome.from({
        outcome: 'VALIDATED' satisfies NominationFileOutcomeEnum,
        comment: null,
      }),
    });

    const messages = session.messages;
    expect(messages).toEqual([new NominationFileOutcomeDefined('nomination-file-id-1', 'VALIDATED', null)]);
  });

  it('should define another nomination file outcome', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: 'VALIDATED',
          docs: [],
        },
      ],
    });

    session.defineNominationFileOutcome({
      nominationFileId: 'nomination-file-id-1',
      outcome: NominationFileOutcome.from({
        outcome: 'WITHDRAWN' satisfies NominationFileOutcomeEnum,
        comment: null,
      }),
    });

    const messages = session.messages;
    expect(messages).toEqual([new NominationFileOutcomeDefined('nomination-file-id-1', 'WITHDRAWN', null)]);
  });

  it('should reset the nomination file outcome', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: 'VALIDATED',
          docs: [],
        },
      ],
    });

    session.defineNominationFileOutcome({
      nominationFileId: 'nomination-file-id-1',
      outcome: null,
    });

    const messages = session.messages;
    expect(messages).toEqual([new NominationFileOutcomeDefined('nomination-file-id-1', null, null)]);
  });

  it('should add attachments to a nomination file', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFiles: [{ id: 'nomination-file-id-1', outcome: null, docs: [] }],
    });

    session.addNominationFileAttachments({
      nominationFileId: 'nomination-file-id-1',
      files: [{ id: 'file-1' }, { id: 'file-2' }],
    });

    expect(session.messages).toEqual([
      new NominationFileAttachmentAdded('nomination-file-id-1', { id: 'file-1' }),
      new NominationFileAttachmentAdded('nomination-file-id-1', { id: 'file-2' }),
    ]);
  });

  it('should remove an attachment from a nomination file', () => {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFiles: [{ id: 'nomination-file-id-1', outcome: null, docs: [] }],
    });

    session.removeNominationFileAttachment({
      nominationFileId: 'nomination-file-id-1',
      fileId: 'file-1',
    });

    expect(session.messages).toEqual([new NominationFileAttachmentRemoved('nomination-file-id-1', 'file-1')]);
  });

  it('should throw when adding an attachment on a file linked to docs', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: 'VALIDATED',
          docs: [
            {
              agenda: { id: 'a1', outcome: 'SUSPENDED' },
              officialReport: { id: 'or-1', outcome: 'VALIDATED' },
            },
          ],
        },
      ],
    });

    expect(() =>
      session.addNominationFileAttachments({
        nominationFileId: 'nomination-file-id-1',
        files: [{ id: 'file-1' }],
      }),
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should throw when removing an attachment on a file linked to docs', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFiles: [
        {
          id: 'nomination-file-id-1',
          outcome: 'VALIDATED',
          docs: [
            {
              agenda: { id: 'a1', outcome: 'SUSPENDED' },
              officialReport: { id: 'or-1', outcome: 'VALIDATED' },
            },
          ],
        },
      ],
    });

    expect(() =>
      session.removeNominationFileAttachment({
        nominationFileId: 'nomination-file-id-1',
        fileId: 'file-1',
      }),
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should throw when attaching to a nomination file that does not belong to the session', () => {
    const session = NominationSession.from({
      id: 'session-id',
      formation: Magistrat.Formation.SIEGE,
      version: null,
      nominationFiles: [],
    });

    expect(() =>
      session.addNominationFileAttachments({
        nominationFileId: 'unknown-nomination-file',
        files: [{ id: 'file-1' }],
      }),
    ).toThrow(CantUpdateNominationFiles);
  });
});
