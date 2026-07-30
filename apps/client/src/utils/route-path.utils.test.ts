import { describe, expect, it } from 'vitest';

import { redirectToMemberMagistratDetails } from './route-path.utils';

describe('redirectToMemberMagistratDetails', () => {
  it('redirects the old transparence URL to the member magistrat details page', () => {
    const response = redirectToMemberMagistratDetails({
      params: { magistratId: 'magistrat-1' },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/magistrats/magistrat-1');
  });
});
