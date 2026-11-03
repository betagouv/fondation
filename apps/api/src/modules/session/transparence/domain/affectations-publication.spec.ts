import { PublishableAffectations } from './affectations-publication';
import { publicationStatusOf } from './publication';

const BERNARD_ON_FILE_1 = { nominationFileId: 'file-1', reporterId: 'bernard' };
const ROCHE_ON_FILE_1 = { nominationFileId: 'file-1', reporterId: 'roche' };

const affectations = (...items: { nominationFileId: string; reporterId: string }[]) =>
  PublishableAffectations.from(items);

describe('publicationStatusOf the affectations', () => {
  it('has nothing to publish while no reporter is affected', () => {
    expect(publicationStatusOf({ current: affectations(), published: null })).toBe('NOTHING_TO_PUBLISH');
  });

  it('waits for a first publication once a reporter is affected', () => {
    expect(publicationStatusOf({ current: affectations(BERNARD_ON_FILE_1), published: null })).toBe(
      'NEVER_PUBLISHED',
    );
  });

  it('is still published when the draft came back to the published reporters', () => {
    expect(
      publicationStatusOf({
        current: affectations(ROCHE_ON_FILE_1, BERNARD_ON_FILE_1),
        published: affectations(BERNARD_ON_FILE_1, ROCHE_ON_FILE_1),
      }),
    ).toBe('PUBLISHED');
  });

  it('tells the draft changed the reporters since the publication', () => {
    expect(
      publicationStatusOf({
        current: affectations(ROCHE_ON_FILE_1),
        published: affectations(BERNARD_ON_FILE_1),
      }),
    ).toBe('UNPUBLISHED_CHANGES');
  });

  it('tells all the reporters were removed since the publication', () => {
    expect(publicationStatusOf({ current: affectations(), published: affectations(BERNARD_ON_FILE_1) })).toBe(
      'UNPUBLISHED_CHANGES',
    );
  });
});
