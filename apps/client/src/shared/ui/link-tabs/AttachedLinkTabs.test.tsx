import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AttachedLinkTab, AttachedLinkTabs } from './AttachedLinkTabs';

describe('AttachedLinkTab', () => {
  it('keeps the query of the page, written there without the router knowing', async () => {
    window.history.replaceState(null, '', '/conseillers');
    render(
      <BrowserRouter>
        <AttachedLinkTabs ariaLabel="Postes">
          <AttachedLinkTab keepsQuery label="Présidents de chambre" to="/presidents-de-chambre" />
        </AttachedLinkTabs>
      </BrowserRouter>,
    );
    window.history.replaceState(null, '', '/conseillers?filters=alert%3A%5B%22RETIREMENT%22%5D');

    await userEvent.click(screen.getByRole('link', { name: 'Présidents de chambre' }));

    expect(`${window.location.pathname}${window.location.search}`).toBe(
      '/presidents-de-chambre?filters=alert%3A%5B%22RETIREMENT%22%5D',
    );
  });

  it('adds no entry to the history when the current tab is clicked again', async () => {
    window.history.replaceState(null, '', '/conseillers');
    render(
      <BrowserRouter>
        <AttachedLinkTabs ariaLabel="Postes">
          <AttachedLinkTab keepsQuery label="Conseillers" to="/conseillers" />
        </AttachedLinkTabs>
      </BrowserRouter>,
    );
    const entries = window.history.length;

    await userEvent.click(screen.getByRole('link', { name: 'Conseillers' }));

    expect(window.history.length).toBe(entries);
  });
});
