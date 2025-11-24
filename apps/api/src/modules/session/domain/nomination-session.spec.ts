import { PrioriteEnum } from 'shared-models';
import {
  NominationSessionFileReportersAffected,
  NominationSession,
  NominationSessionAffectationVersionCreated,
  NominationSessionAffectationVersionPublished,
  NominationSessionFilePriorityUpdated,
  NonFormationMemberDefinedAsReporter,
} from './nomination-session';

describe('NominationSession', () => {
  it('should affect reporters to nomination files', () => {
    const session = NominationSession.from({
      id: 'session-id',
      version: { id: 'version-id', version: 3, isDraft: true },
      formationMemberIds: new Set(['reporter-1', 'reporter-2']),
    });

    session.affectNominationFileReporters([
      {
        nominationFileId: 'nomination-file-id-1',
        reporterIds: ['reporter-1', 'reporter-2'],
      },
    ]);

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

  it('should create a new version when the version is already published', () => {
    const session = NominationSession.from({
      id: 'session-id',
      version: { id: 'version-id', version: 3, isDraft: false },
      formationMemberIds: new Set(['reporter-1', 'reporter-2']),
    });

    session.affectNominationFileReporters([
      {
        nominationFileId: 'nomination-file-id-1',
        reporterIds: ['reporter-1', 'reporter-2'],
      },
    ]);

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
      version: { id: 'version-id', version: 3, isDraft: true },
      formationMemberIds: new Set(['reporter-1']),
    });

    expect(() =>
      session.affectNominationFileReporters([
        {
          nominationFileId: 'nomination-file-id-1',
          reporterIds: ['reporter-1', 'reporter-2'],
        },
      ]),
    ).toThrow(NonFormationMemberDefinedAsReporter);
  });

  it('should define a nomination file priority', () => {
    const session = NominationSession.from({
      id: 'session-id',
      version: { id: 'version-id', version: 3, isDraft: true },
      formationMemberIds: new Set<string>(),
    });

    session.setNominationFilePriority({
      nominationFileId: 'nomination-file-id-1',
      priority: PrioriteEnum.OUTRE_MER,
    });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionFilePriorityUpdated(
        'session-id',
        'nomination-file-id-1',
        PrioriteEnum.OUTRE_MER,
      ),
    ]);
  });

  it('should unset a nomination file priority', () => {
    const session = NominationSession.from({
      id: 'session-id',
      version: { id: 'version-id', version: 3, isDraft: true },
      formationMemberIds: new Set<string>(),
    });

    session.setNominationFilePriority({
      nominationFileId: 'nomination-file-id-1',
      priority: null,
    });

    const { messages } = session;
    expect(messages).toEqual([
      new NominationSessionFilePriorityUpdated(
        'session-id',
        'nomination-file-id-1',
        null,
      ),
    ]);
  });

  it('should publish a draft version', () => {
    const session = NominationSession.from({
      id: 'session-id',
      version: { id: 'version-id', version: 3, isDraft: true },
      formationMemberIds: new Set<string>(),
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
      version: { id: 'version-id', version: 3, isDraft: false },
      formationMemberIds: new Set<string>(),
    });

    session.publishAffectationVersion({ userId: 'user-id' });

    const { messages } = session;
    expect(messages).toEqual([]);
  });
});
