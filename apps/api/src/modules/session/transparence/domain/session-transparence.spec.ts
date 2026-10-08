import { randomUUID } from 'node:crypto';

import {
  NominationFileOutcome,
  NominationFileOutcomeEnum,
} from 'src/modules/shared/nomination-file-outcome.enum';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';

import {
  CannotScheduleAuditionOnNominationFile,
  CantUpdateNominationFiles,
  LodamSessionTransparenceFilesCreated,
  NonFormationMemberDefinedAsReporter,
  PositionAuditionCannotBeDismissed,
  SessionTransparence,
  SessionTransparenceAffectationHasUnknownReporter,
  SessionTransparenceAffectationVersionCreated,
  SessionTransparenceAffectationVersionPublished,
  SessionTransparenceAuditionRequestDefined,
  SessionTransparenceAuditionScheduled,
  SessionTransparenceAuditionUnScheduled,
  SessionTransparenceCommentWritten,
  SessionTransparenceCreated,
  SessionTransparenceFileAttachmentAdded,
  SessionTransparenceFileAttachmentRemoved,
  SessionTransparenceFileMissingEvaluationCommentUpdated,
  SessionTransparenceFileMissingEvaluationUpdated,
  SessionTransparenceFilePrioritiesUpdated,
  SessionTransparenceFileReportersAffected,
  SessionTransparenceFilesObserversUpdated,
  SessionTransparenceOutcomeDefined,
  SessionTransparenceValidated,
  UnknownNominationFiles,
  UnrequestedAuditionCannotBeScheduled,
} from './session-transparence';
import { LodamTransparenceFile } from './transparence-file';

describe('SessionTransparence', () => {
  it('should affect reporters to nomination files', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: { id: 'version-id', isDraft: true, version: 3 },
    });

    session.affectNominationFileReporters({
      affectations: [
        {
          nominationFileId: 'nomination-file-id-1',
          reporterIds: ['reporter-1', 'reporter-2'],
        },
      ],
      authorId: 'author-id',
      formationMemberIds: new Set(['reporter-1', 'reporter-2']),
    });

    const { messages } = session;
    expect(messages).toEqual([
      new SessionTransparenceFileReportersAffected('session-id', 'version-id', [
        {
          nominationFileId: 'nomination-file-id-1',
          reporterIds: ['reporter-1', 'reporter-2'],
        },
      ]),
    ]);
  });

  it('should throw when trying to affect on files already presented', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: true,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: { id: 'version-id', isDraft: true, version: 3 },
    });

    expect(() =>
      session.affectNominationFileReporters({
        affectations: [
          {
            nominationFileId: 'nomination-file-id-1',
            reporterIds: ['reporter-1', 'reporter-2'],
          },
        ],
        authorId: 'author-id',
        formationMemberIds: new Set(['reporter-1', 'reporter-2']),
      }),
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should create a new version when the version is already published', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: { id: 'version-id', isDraft: false, version: 3 },
    });

    session.affectNominationFileReporters({
      affectations: [
        {
          nominationFileId: 'nomination-file-id-1',
          reporterIds: ['reporter-1', 'reporter-2'],
        },
      ],
      authorId: 'author-id',
      formationMemberIds: new Set(['reporter-1', 'reporter-2']),
    });

    const { messages } = session;
    expect(messages).toEqual([
      new SessionTransparenceAffectationVersionCreated(
        'session-id',
        { id: expect.any(String), version: 4 },
        'author-id',
      ),
      new SessionTransparenceFileReportersAffected('session-id', expect.any(String), [
        {
          nominationFileId: 'nomination-file-id-1',
          reporterIds: ['reporter-1', 'reporter-2'],
        },
      ]),
    ]);
  });

  it('should throw when trying to affect a non formation member', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: { id: 'version-id', isDraft: true, version: 3 },
    });

    expect(() =>
      session.affectNominationFileReporters({
        affectations: [
          {
            nominationFileId: 'nomination-file-id-1',
            reporterIds: ['reporter-1', 'reporter-2'],
          },
        ],
        authorId: 'author-id',
        formationMemberIds: new Set(['reporter-1']),
      }),
    ).toThrow(NonFormationMemberDefinedAsReporter);
  });

  it('should define a nomination file priority', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: { id: 'version-id', isDraft: true, version: 3 },
    });

    session.setNominationFilePriority({
      nominationFileId: 'nomination-file-id-1',
      priorities: ['OUTRE_MER'],
    });

    const { messages } = session;
    expect(messages).toEqual([
      new SessionTransparenceFilePrioritiesUpdated('session-id', 'nomination-file-id-1', ['OUTRE_MER']),
    ]);
  });

  it('should throw when defining a priority on a file already presented', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: true,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: { id: 'version-id', isDraft: true, version: 3 },
    });

    expect(() =>
      session.setNominationFilePriority({
        nominationFileId: 'nomination-file-id-1',
        priorities: ['OUTRE_MER'],
      }),
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should unset a nomination file priority', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: { id: 'version-id', isDraft: true, version: 3 },
    });

    session.setNominationFilePriority({
      nominationFileId: 'nomination-file-id-1',
      priorities: [],
    });

    const { messages } = session;
    expect(messages).toEqual([
      new SessionTransparenceFilePrioritiesUpdated('session-id', 'nomination-file-id-1', []),
    ]);
  });

  it('should publish a draft version', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [],
      version: { id: 'version-id', isDraft: true, version: 3 },
    });

    session.publishAffectationVersion({ userId: 'user-id' });

    const { messages } = session;
    expect(messages).toEqual([
      new SessionTransparenceAffectationVersionPublished('session-id', 'version-id', 'user-id'),
    ]);
  });

  it('should NOT publish a published version', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [],
      version: { id: 'version-id', isDraft: false, version: 3 },
    });

    session.publishAffectationVersion({ userId: 'user-id' });

    const { messages } = session;
    expect(messages).toEqual([]);
  });

  it('should publish an unknown version', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [],
      version: null,
    });

    session.publishAffectationVersion({ userId: 'user-id' });

    const { messages } = session;
    expect(messages).toEqual([
      new SessionTransparenceAffectationVersionPublished('session-id', undefined, 'user-id'),
    ]);
  });

  describe('NominationSession tree creation (LODAM)', () => {
    it('should create a nomination session tree', () => {
      const session = SessionTransparence.createLodamNominationTreeAndAffectMembers({
        name: 'TEST transparence LODAM PARQUET',
        date: new DateOnly(2025, 1, 1),
        observationClosingDate: new DateOnly(2025, 2, 1),
        formation: 'PARQUET',
        typeDeSaisine: 'TRANSPARENCE_GDS',
        dueDate: null,
        positionStartDate: null,
        userId: randomUUID(),

        // oxfmt-ignore
        formationMembers: [
            {
              fullName: "BOURDIEU Pierre",
              id: "51176c69-4f03-4973-9d25-0f83c7ad6931",
            },
          ],
        // oxfmt-ignore
        files: [
            {
              biography: null,
              birthDate: new DateOnly(1968, 4, 9),
              careerInformation: null,
              currentPosition: "Procureur de la République TJ NARBONNE",
              fileNumber: 1,
              grade: 'HH',
              lastPositionDate: new DateOnly(2020, 9, 1),
              lastRankingDate: new DateOnly(2010, 12, 17),
              name: "ARENDT HANNAH",
              observers: [],
              rank: "(10 sur une liste de 12)",
              reporters: ["BOURDIEU Pierre"],
              targetedGrade: 'HH',
              targetedPosition: "Procureur de la République TJ GRASSE",
            },
            {
              biography: null,
              birthDate: new DateOnly(1991, 12, 23),
              careerInformation: null,
              currentPosition: "Juge TJ  SAINT PIERRE DE LA REUNION",
              fileNumber: 2,
              grade: 'I',
              lastPositionDate: new DateOnly(2019, 9, 1),
              lastRankingDate: new DateOnly(2019, 12, 7),
              name: "GRAMSCI ANTONIO",
              observers: [],
              rank: "(2 sur une liste de 2)",
              reporters: ["BOURDIEU Pierre"],
              targetedGrade: 'I',
              targetedPosition: "Vice-président TJ  CAHORS",
            },
          ],
      });

      expect(session.messages[0]).toEqual(
        new SessionTransparenceCreated(
          session.id,
          'TEST transparence LODAM PARQUET',
          'TRANSPARENCE_GDS',
          'PARQUET',
          new DateOnly(2025, 1, 1),
          new DateOnly(2025, 2, 1),
          null,
          null,
          null,
        ),
      );

      expect(session.messages[1]).toEqual(new SessionTransparenceValidated(session.id, expect.any(String)));

      expect(session.messages[2]).toEqual(
        new LodamSessionTransparenceFilesCreated(
          session.id,
          // oxfmt-ignore
          [
            {
              biography: null,
              birthDate: new DateOnly(1968, 4, 9),
              careerInformation: null,
              currentPosition: "Procureur de la République TJ NARBONNE",
              fileNumber: 1,
              grade: 'HH',
              id: expect.any(String),
              lastPositionDate: new DateOnly(2020, 9, 1),
              lastRankingDate: new DateOnly(2010, 12, 17),
              name: "ARENDT HANNAH",
              observers: [],
              rank: "(10 sur une liste de 12)",
              reporters: ["BOURDIEU Pierre"],
              targetedGrade: 'HH',
              targetedPosition: "Procureur de la République TJ GRASSE",
            },
            {
              biography: null,
              birthDate: new DateOnly(1991, 12, 23),
              careerInformation: null,
              currentPosition: "Juge TJ  SAINT PIERRE DE LA REUNION",
              fileNumber: 2,
              grade: 'I',
              id: expect.any(String),
              lastPositionDate: new DateOnly(2019, 9, 1),
              lastRankingDate: new DateOnly(2019, 12, 7),
              name: "GRAMSCI ANTONIO",
              observers: [],
              rank: "(2 sur une liste de 2)",
              reporters: ["BOURDIEU Pierre"],
              targetedGrade: 'I',
              targetedPosition: "Vice-président TJ  CAHORS",
            },
          ],
        ),
      );

      expect(session.messages[3]).toEqual(
        new SessionTransparenceFileReportersAffected(
          session.id,
          null,
          // oxfmt-ignore
          [
            {
              nominationFileId: expect.any(String),
              reporterIds: ["51176c69-4f03-4973-9d25-0f83c7ad6931"],
            },
            {
              nominationFileId: expect.any(String),
              reporterIds: ["51176c69-4f03-4973-9d25-0f83c7ad6931"],
            },
          ],
        ),
      );
    });

    it('should throw, when affecting an unknown reporter', () => {
      const act = () =>
        SessionTransparence.createLodamNominationTreeAndAffectMembers({
          name: 'TEST transparence LODAM PARQUET',
          date: new DateOnly(2025, 1, 1),
          observationClosingDate: new DateOnly(2025, 2, 1),
          formation: 'PARQUET',
          typeDeSaisine: 'TRANSPARENCE_GDS',
          dueDate: null,
          positionStartDate: null,
          userId: randomUUID(),

          // oxfmt-ignore
          formationMembers: [],
          // oxfmt-ignore
          files: [
            { fileNumber: 1, reporters: ['BOURDIEU Pierre'] },
            { fileNumber: 2, reporters: ['BOURDIEU Pierre'] },
          ] as LodamTransparenceFile[],
        });

      expect(act).toThrow(SessionTransparenceAffectationHasUnknownReporter);
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
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: makeId('NominationSessionId'),
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nf-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    session.updateNominationFileObservers({
      existingNominationFiles: [{ fileNumber: 1, id: 'nf-1' }],
      nominationFiles: [{ fileNumber: 1, observers: ['BOURDIEU Pierre'] }],
    });

    const [message] = session.messages;
    expect(message).toEqual(
      new SessionTransparenceFilesObserversUpdated(session.id, [
        { id: 'nf-1', observers: ['BOURDIEU Pierre'] },
      ]),
    );
  });

  it('should throw when updating observers, but file number is unknown', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: makeId('NominationSessionId'),
      nominationFiles: [],
      version: null,
    });

    expect(() =>
      session.updateNominationFileObservers({
        existingNominationFiles: [],
        nominationFiles: [{ fileNumber: 1, observers: ['BOURDIEU Pierre'] }],
      }),
    ).toThrow(new UnknownNominationFiles([1]));
  });

  it('should throw when updating observers on files already presented', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: makeId('NominationSessionId'),
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: true,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    expect(() =>
      session.updateNominationFileObservers({
        existingNominationFiles: [{ fileNumber: 1, id: 'nomination-file-id-1' }],
        nominationFiles: [{ fileNumber: 1, observers: ['BOURDIEU Pierre'] }],
      }),
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should define the nomination file outcome', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: makeId('NominationSessionId'),
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    session.defineNominationFileOutcome({
      nominationFileId: 'nomination-file-id-1',
      outcome: NominationFileOutcome.from({
        comment: null,
        outcome: 'VALIDATED' satisfies NominationFileOutcomeEnum,
      }),
    });

    const messages = session.messages;
    expect(messages).toEqual([
      new SessionTransparenceOutcomeDefined('nomination-file-id-1', 'VALIDATED', null),
    ]);
  });

  it('should define another nomination file outcome', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: makeId('NominationSessionId'),
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    session.defineNominationFileOutcome({
      nominationFileId: 'nomination-file-id-1',
      outcome: NominationFileOutcome.from({
        comment: null,
        outcome: 'WITHDRAWN' satisfies NominationFileOutcomeEnum,
      }),
    });

    const messages = session.messages;
    expect(messages).toEqual([
      new SessionTransparenceOutcomeDefined('nomination-file-id-1', 'WITHDRAWN', null),
    ]);
  });

  it('should reset the nomination file outcome', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: makeId('NominationSessionId'),
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    session.defineNominationFileOutcome({
      nominationFileId: 'nomination-file-id-1',
      outcome: null,
    });

    const messages = session.messages;
    expect(messages).toEqual([new SessionTransparenceOutcomeDefined('nomination-file-id-1', null, null)]);
  });

  it('should schedule an audition on a pending nomination file', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: true,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    const auditionDate = new DateOnly(2026, 7, 10);
    const auditionTime = { hours: 14, minutes: 30, seconds: 0 };

    session.scheduleAudition({
      auditionDateTime: { date: auditionDate, time: auditionTime },
      impersonatorId: null,
      nominationFileId: 'nomination-file-id-1',
      userId: 'user-id',
    });

    expect(session.messages).toEqual([
      new SessionTransparenceAuditionScheduled(
        'session-id',
        'nomination-file-id-1',
        { date: auditionDate, time: auditionTime },
        'user-id',
        null,
      ),
    ]);
  });

  it('should throw when scheduling an audition nobody planned', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    expect(() =>
      session.scheduleAudition({
        auditionDateTime: { date: new DateOnly(2026, 7, 10), time: { hours: 14, minutes: 30, seconds: 0 } },
        impersonatorId: null,
        nominationFileId: 'nomination-file-id-1',
        userId: 'user-id',
      }),
    ).toThrow(UnrequestedAuditionCannotBeScheduled);
  });

  it('should throw when scheduling an audition on a file whose decision is final', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    expect(() =>
      session.scheduleAudition({
        auditionDateTime: {
          date: new DateOnly(2026, 7, 10),
          time: { hours: 14, minutes: 30, seconds: 0 },
        },
        impersonatorId: null,
        nominationFileId: 'nomination-file-id-1',
        userId: 'user-id',
      }),
    ).toThrow(CannotScheduleAuditionOnNominationFile);
  });

  it('should request an audition on a pending nomination file', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    session.defineAuditionRequest({
      impersonatorId: null,
      nominationFileId: 'nomination-file-id-1',
      requested: true,
      userId: 'user-id',
    });

    expect(session.messages).toEqual([
      new SessionTransparenceAuditionRequestDefined(
        'session-id',
        'nomination-file-id-1',
        true,
        'user-id',
        null,
      ),
    ]);
  });

  it('should throw when requesting an audition on a file whose decision is final', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    expect(() =>
      session.defineAuditionRequest({
        impersonatorId: null,
        nominationFileId: 'nomination-file-id-1',
        requested: true,
        userId: 'user-id',
      }),
    ).toThrow(CannotScheduleAuditionOnNominationFile);
  });

  it('should not dismiss the audition a position requires', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: true,
        },
      ],
      version: null,
    });

    expect(() =>
      session.defineAuditionRequest({
        impersonatorId: null,
        nominationFileId: 'nomination-file-id-1',
        requested: false,
        userId: 'user-id',
      }),
    ).toThrow(PositionAuditionCannotBeDismissed);
  });

  it('should clear the audition without checking the outcome when no date is provided', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    session.unscheduleAudition({
      impersonatorId: null,
      nominationFileId: 'nomination-file-id-1',
      userId: 'user-id',
    });

    expect(session.messages).toEqual([
      new SessionTransparenceAuditionUnScheduled('session-id', 'nomination-file-id-1', 'user-id', null),
    ]);
  });

  it('should write a trimmed session comment', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [],
      version: null,
    });

    session.writeComment({
      comment: '  Une note pour la notice \n',
      impersonatorId: null,
      userId: 'user-id',
    });

    expect(session.messages).toEqual([
      new SessionTransparenceCommentWritten('session-id', 'Une note pour la notice', 'user-id', null),
    ]);
  });

  it('should clear the session comment when only blanks are written', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [],
      version: null,
    });

    session.writeComment({ comment: ' \n ', impersonatorId: 'admin-id', userId: 'user-id' });

    expect(session.messages).toEqual([
      new SessionTransparenceCommentWritten('session-id', null, 'user-id', 'admin-id'),
    ]);
  });

  it('should flag a missing evaluation on a nomination file', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    session.updateMissingEvaluation({
      missingEvaluation: true,
      nominationFileId: 'nomination-file-id-1',
    });

    expect(session.messages).toEqual([
      new SessionTransparenceFileMissingEvaluationUpdated('session-id', 'nomination-file-id-1', true),
    ]);
  });

  it('should clear a missing evaluation on a nomination file', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    session.updateMissingEvaluation({
      missingEvaluation: false,
      nominationFileId: 'nomination-file-id-1',
    });

    expect(session.messages).toEqual([
      new SessionTransparenceFileMissingEvaluationUpdated('session-id', 'nomination-file-id-1', false),
      new SessionTransparenceFileMissingEvaluationCommentUpdated('session-id', 'nomination-file-id-1', null),
    ]);
  });

  it('should comment a missing evaluation on a nomination file', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    session.updateMissingEvaluationComment({
      comment: 'Relancée le 12 août',
      nominationFileId: 'nomination-file-id-1',
    });

    expect(session.messages).toEqual([
      new SessionTransparenceFileMissingEvaluationCommentUpdated(
        'session-id',
        'nomination-file-id-1',
        'Relancée le 12 août',
      ),
    ]);
  });

  it('should throw when commenting a missing evaluation on a file whose decision is final', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: true,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    expect(() =>
      session.updateMissingEvaluationComment({
        comment: 'Relancée le 12 août',
        nominationFileId: 'nomination-file-id-1',
      }),
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should throw when flagging a missing evaluation on a file whose decision is final', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: true,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    expect(() =>
      session.updateMissingEvaluation({
        missingEvaluation: true,
        nominationFileId: 'nomination-file-id-1',
      }),
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should add attachments to a nomination file', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: makeId('NominationSessionId'),
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    session.addNominationFileAttachments({
      files: [{ id: 'file-1' }, { id: 'file-2' }],
      nominationFileId: 'nomination-file-id-1',
      type: 'FICHE_DE_JURIDICTION',
    });

    expect(session.messages).toEqual([
      new SessionTransparenceFileAttachmentAdded(
        'nomination-file-id-1',
        { id: 'file-1' },
        'FICHE_DE_JURIDICTION',
      ),
      new SessionTransparenceFileAttachmentAdded(
        'nomination-file-id-1',
        { id: 'file-2' },
        'FICHE_DE_JURIDICTION',
      ),
    ]);
  });

  it('should remove an attachment from a nomination file', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: makeId('NominationSessionId'),
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: false,
          outcome: null,
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    session.removeNominationFileAttachment({
      fileId: 'file-1',
      nominationFileId: 'nomination-file-id-1',
    });

    expect(session.messages).toEqual([
      new SessionTransparenceFileAttachmentRemoved('nomination-file-id-1', 'file-1'),
    ]);
  });

  it('should throw when adding an attachment on a file already presented', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: true,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    expect(() =>
      session.addNominationFileAttachments({
        files: [{ id: 'file-1' }],
        nominationFileId: 'nomination-file-id-1',
        type: 'AUTRE',
      }),
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should throw when removing an attachment on a file already presented', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [
        {
          auditionRequired: false,
          id: 'nomination-file-id-1',
          isReported: true,
          outcome: 'VALIDATED',
          positionRequiresAudition: false,
        },
      ],
      version: null,
    });

    expect(() =>
      session.removeNominationFileAttachment({
        fileId: 'file-1',
        nominationFileId: 'nomination-file-id-1',
      }),
    ).toThrow(CantUpdateNominationFiles);
  });

  it('should throw when attaching to a nomination file that does not belong to the session', () => {
    const session = SessionTransparence.from({
      formation: 'SIEGE',
      id: 'session-id',
      nominationFiles: [],
      version: null,
    });

    expect(() =>
      session.addNominationFileAttachments({
        files: [{ id: 'file-1' }],
        nominationFileId: 'unknown-nomination-file',
        type: 'AUTRE',
      }),
    ).toThrow(CantUpdateNominationFiles);
  });
});
