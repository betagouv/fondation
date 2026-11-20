import { describe, expect, it } from 'vitest';

import {
  courtOfCassationPositionOf,
  courtOfCassationPositionPath,
} from './court-of-cassation-position-paths';

describe('court of cassation position paths', () => {
  it('reads back the position of its path', () => {
    const path = courtOfCassationPositionPath('REFERENDARY_COUNSELLOR');

    expect(path).toBe(
      '/secretariat-general/csm/veille-des-postes/cour-de-cassation/conseillers-referendaires',
    );
    expect(courtOfCassationPositionOf(path.split('/').at(-1))).toBe('REFERENDARY_COUNSELLOR');
  });

  it('knows no position for an unknown or missing slug, which the tab sends to the first president', () => {
    expect(courtOfCassationPositionOf('juges')).toBeUndefined();
    expect(courtOfCassationPositionOf(undefined)).toBeUndefined();
  });
});
