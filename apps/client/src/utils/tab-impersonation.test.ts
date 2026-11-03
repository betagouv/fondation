import { afterEach, describe, expect, it } from 'vitest';

import { tabImpersonation } from './tab-impersonation';

const ID = '7b0f6e4c-2a51-4d6b-9a3e-1c2d3e4f5a6b';

afterEach(() => {
  tabImpersonation.forget();
  window.history.replaceState(null, '', '/');
});

describe('tabImpersonation', () => {
  it('takes the impersonation from the address the admin opened, then clears it from there', () => {
    window.history.replaceState(null, '', `/transparences?page=2#impersonation=${ID}`);

    tabImpersonation.adoptFromAddress();

    expect(tabImpersonation.id).toBe(ID);
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      '/transparences?page=2',
    );
  });

  it('keeps the name once the impersonation ends on its own, not once the admin ends it', () => {
    window.history.replaceState(null, '', `/#impersonation=${ID}`);
    tabImpersonation.adoptFromAddress();
    tabImpersonation.remember('Sophie SIÈGE');
    expect(tabImpersonation.endedFor).toBeNull();

    tabImpersonation.end();
    expect(tabImpersonation.endedFor).toBe('Sophie SIÈGE');

    tabImpersonation.forget();
    expect(tabImpersonation.endedFor).toBeNull();
  });

  it('carries the impersonation to a new tab, never over an anchor of the page', () => {
    expect(tabImpersonation.carry(new URL('https://fondation.fr/transparences'), ID).hash).toBe(
      `#impersonation=${ID}`,
    );
    expect(tabImpersonation.carry(new URL('https://fondation.fr/aide#connexion'), ID).hash).toBe(
      '#connexion',
    );
  });

  it('takes the impersonation along a link of Fondation opening a new tab, and nowhere else', () => {
    tabImpersonation.carryIntoNewTabs();
    const link = Object.assign(document.createElement('a'), { href: '/aide', target: '_blank' });
    const hrefs: string[] = [];
    link.addEventListener('click', (event) => {
      hrefs.push(link.href);
      event.preventDefault();
    });
    document.body.append(link);

    link.click();
    window.history.replaceState(null, '', `/#impersonation=${ID}`);
    tabImpersonation.adoptFromAddress();
    link.click();
    link.remove();

    expect(hrefs).toEqual([
      `${window.location.origin}/aide`,
      `${window.location.origin}/aide#impersonation=${ID}`,
    ]);
  });
});
