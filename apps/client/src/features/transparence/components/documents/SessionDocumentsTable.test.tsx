import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { SessionDocumentsTable, type SessionDocument } from './SessionDocumentsTable';

function MountProbe(props: { name: string; onMount: () => void }) {
  const { onMount } = props;
  useEffect(() => onMount(), [onMount]);
  return <span>{props.name}</span>;
}

const DOCS: SessionDocument[] = [
  {
    id: 'agenda-1',
    type: 'agenda',
    name: 'Ordre du jour du 12 mars',
    isLinkedToOfficialReport: false,
  },
  {
    id: 'pv-1',
    type: 'officialReport',
    name: 'Procès-verbal du 12 mars',
    outdated: true,
  },
];

describe('SessionDocumentsTable', () => {
  it('should let the name cell handle its own clicks', async () => {
    const onOpen = vi.fn();

    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <SessionDocumentsTable
          docs={DOCS}
          renderName={(doc) => (
            <button onClick={() => onOpen(doc.id)} type="button">
              {doc.name}
            </button>
          )}
        />
      </IntlProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ordre du jour du 12 mars' }));

    expect(onOpen).toHaveBeenCalledWith('agenda-1');
  });

  it('should keep the cells mounted when the render props change identity', () => {
    const onMount = vi.fn();

    const table = (
      <IntlProvider defaultLocale="fr" locale="fr">
        <SessionDocumentsTable
          docs={DOCS}
          renderName={(doc) => <MountProbe name={doc.name} onMount={onMount} />}
        />
      </IntlProvider>
    );

    const view = render(table);
    const mountsAfterFirstRender = onMount.mock.calls.length;

    view.rerender(
      <IntlProvider defaultLocale="fr" locale="fr">
        <SessionDocumentsTable
          docs={[...DOCS]}
          renderName={(doc) => <MountProbe name={doc.name} onMount={onMount} />}
        />
      </IntlProvider>,
    );

    expect(onMount.mock.calls.length).toBe(mountsAfterFirstRender);
  });

  it('should tell an agenda still waiting for its official report', () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <SessionDocumentsTable docs={DOCS} />
      </IntlProvider>,
    );

    expect(screen.getByText('pv attendu')).toBeVisible();
    expect(screen.getByText('À vérifier')).toBeVisible();
  });
});
