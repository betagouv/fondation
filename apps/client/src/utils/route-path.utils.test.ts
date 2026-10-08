import { describe, expect, it } from 'vitest';

import { backToFilesListSearch, redirectToMemberMagistratDetails } from './route-path.utils';

describe('redirectToMemberMagistratDetails', () => {
  it('redirects the old transparence URL to the member magistrat details page', () => {
    const response = redirectToMemberMagistratDetails({
      params: { magistratId: 'magistrat-1' },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/magistrats/magistrat-1');
  });
});

describe('backToFilesListSearch', () => {
  it('keeps the filters of the list the report was opened from', () => {
    expect(
      backToFilesListSearch({ filesListSearch: '?filters=reporters:user-1&dossier=file-1' }, 'file-2'),
    ).toBe('?filters=reporters%3Auser-1&dossier=file-2');
  });

  it('only opens the file when the report was reached otherwise', () => {
    expect(backToFilesListSearch(null, 'file-2')).toBe('?dossier=file-2');
  });
});
