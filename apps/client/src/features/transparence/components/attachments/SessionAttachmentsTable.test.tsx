import type { SortingState } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { SessionAttachmentsTable, type SessionAttachment } from './SessionAttachmentsTable';

function MountProbe(props: { name: string; onMount: () => void }) {
  const { onMount } = props;
  useEffect(() => onMount(), [onMount]);
  return <span>{props.name}</span>;
}

const ATTACHMENTS: SessionAttachment[] = [
  {
    addedAt: { day: 2, month: 3, year: 2028 },
    id: 'c',
    name: 'Tableau des effectifs.xlsx',
    sizeInBytes: 86_000,
  },
  {
    addedAt: { day: 4, month: 2, year: 2028 },
    id: 'a',
    name: 'Fiche de juridiction.pdf',
    sizeInBytes: 248_000,
  },
  { addedAt: { day: 11, month: 2, year: 2028 }, id: 'b', name: 'Note DSJ.pdf', sizeInBytes: null },
];

function renderTable(sorting: SortingState) {
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <SessionAttachmentsTable attachments={ATTACHMENTS} sorting={sorting} />
    </IntlProvider>,
  );

  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent);
}

describe('SessionAttachmentsTable', () => {
  it('should keep the given order when nothing is sorted', () => {
    const rows = renderTable([]);

    expect(rows[0]).toContain('Tableau des effectifs.xlsx');
    expect(rows[2]).toContain('Note DSJ.pdf');
  });

  it('should sort by name', () => {
    const rows = renderTable([{ desc: false, id: 'name' }]);

    expect(rows[0]).toContain('Fiche de juridiction.pdf');
    expect(rows[2]).toContain('Tableau des effectifs.xlsx');
  });

  it('should sort by date, oldest first', () => {
    const rows = renderTable([{ desc: false, id: 'addedAt' }]);

    expect(rows[0]).toContain('Fiche de juridiction.pdf');
    expect(rows[1]).toContain('Note DSJ.pdf');
    expect(rows[2]).toContain('Tableau des effectifs.xlsx');
  });

  it('should keep the cells mounted when the render props change identity', () => {
    const onMount = vi.fn();

    const view = render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <SessionAttachmentsTable
          attachments={ATTACHMENTS}
          renderName={(attachment) => <MountProbe name={attachment.name} onMount={onMount} />}
        />
      </IntlProvider>,
    );
    const mountsAfterFirstRender = onMount.mock.calls.length;

    view.rerender(
      <IntlProvider defaultLocale="fr" locale="fr">
        <SessionAttachmentsTable
          attachments={[...ATTACHMENTS]}
          renderName={(attachment) => <MountProbe name={attachment.name} onMount={onMount} />}
        />
      </IntlProvider>,
    );

    expect(onMount.mock.calls.length).toBe(mountsAfterFirstRender);
  });
});
