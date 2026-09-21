import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { groupSessionDocuments } from './session-document-groups';
import { SessionDocumentsTable, type SessionDocument } from './SessionDocumentsTable';

const CREATED_AT = '2028-03-10T09:00:00.000Z';
const VALIDATED_AT = '2028-03-10T11:00:00.000Z';

function MountProbe(props: { name: string; onMount: () => void }) {
  const { onMount } = props;
  useEffect(() => onMount(), [onMount]);
  return <span>{props.name}</span>;
}

const DOCS: SessionDocument[] = [
  {
    createdAt: CREATED_AT,
    hasDraft: false,
    id: 'agenda-1',
    name: 'Ordre du jour du 12 mars',
    officialReportId: null,
    outdated: false,
    status: 'VALIDATED',
    type: 'agenda',
    validatedAt: VALIDATED_AT,
  },
  {
    createdAt: '2028-03-13T09:00:00.000Z',
    hasDraft: false,
    id: 'pv-1',
    name: 'Procès-verbal du 12 mars',
    outdated: true,
    status: 'VALIDATED',
    type: 'officialReport',
    validatedAt: '2028-03-13T11:00:00.000Z',
  },
];

function table(docs: readonly SessionDocument[], renderName?: (doc: SessionDocument) => ReactNode) {
  return (
    <IntlProvider defaultLocale="fr" locale="fr">
      <SessionDocumentsTable groups={groupSessionDocuments(docs)} renderName={renderName} />
    </IntlProvider>
  );
}

const rowTexts = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent);

describe('SessionDocumentsTable', () => {
  it('should let the name cell handle its own clicks', async () => {
    const onOpen = vi.fn();

    render(
      table(DOCS, (doc) => (
        <button onClick={() => onOpen(doc.id)} type="button">
          {doc.name}
        </button>
      )),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ordre du jour du 12 mars' }));

    expect(onOpen).toHaveBeenCalledWith('agenda-1');
  });

  it('should keep the cells mounted when the render props change identity', () => {
    const onMount = vi.fn();
    const renderName = (doc: SessionDocument) => <MountProbe name={doc.name} onMount={onMount} />;

    const view = render(table(DOCS, renderName));
    const mountsAfterFirstRender = onMount.mock.calls.length;

    view.rerender(table([...DOCS], renderName));

    expect(onMount.mock.calls.length).toBe(mountsAfterFirstRender);
  });

  it('should place an official report right after the agendas it covers', () => {
    render(
      table([
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-siege',
          name: 'ODJ siège',
          officialReportId: 'pv-1',
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-orphan',
          name: 'ODJ sans PV',
          officialReportId: null,
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-parquet',
          name: 'ODJ parquet',
          officialReportId: 'pv-1',
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'pv-1',
          name: 'PV du 12 mars',
          outdated: false,
          status: 'VALIDATED',
          type: 'officialReport',
          validatedAt: VALIDATED_AT,
        },
      ]),
    );

    expect(rowTexts()).toEqual([
      expect.stringContaining('ODJ siège'),
      expect.stringContaining('ODJ parquet'),
      expect.stringContaining('PV du 12 mars'),
      expect.stringContaining('ODJ sans PV'),
    ]);
  });

  it('should group the documents until the reader asks for a sort by type', async () => {
    render(
      table([
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-siege',
          name: 'ODJ siège',
          officialReportId: 'pv-1',
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'pv-1',
          name: 'PV du 12 mars',
          outdated: false,
          status: 'VALIDATED',
          type: 'officialReport',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-orphan',
          name: 'ODJ sans PV',
          officialReportId: null,
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
      ]),
    );

    expect(rowTexts()).toEqual([
      expect.stringContaining('ODJ siège'),
      expect.stringContaining('PV du 12 mars'),
      expect.stringContaining('ODJ sans PV'),
    ]);

    await userEvent.click(screen.getByRole('button', { name: /Type/ }));

    expect(rowTexts()).toEqual([
      expect.stringContaining('ODJ siège'),
      expect.stringContaining('ODJ sans PV'),
      expect.stringContaining('PV du 12 mars'),
    ]);
  });

  it('should offer to see the associated documents from both sides', () => {
    render(
      table([
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-siege',
          name: 'ODJ siège',
          officialReportId: 'pv-1',
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-parquet',
          name: 'ODJ parquet',
          officialReportId: 'pv-1',
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'pv-1',
          name: 'PV du 12 mars',
          outdated: false,
          status: 'VALIDATED',
          type: 'officialReport',
          validatedAt: VALIDATED_AT,
        },
      ]),
    );

    expect(screen.getAllByRole('button', { name: 'Voir le PV associé' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Voir les 2 ODJ associés' })).toBeVisible();
  });

  it('should highlight the associated document', async () => {
    render(
      table([
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-siege',
          name: 'ODJ siège',
          officialReportId: 'pv-1',
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-parquet',
          name: 'ODJ parquet',
          officialReportId: 'pv-1',
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'pv-1',
          name: 'PV du 12 mars',
          outdated: false,
          status: 'VALIDATED',
          type: 'officialReport',
          validatedAt: VALIDATED_AT,
        },
      ]),
    );

    const [seeOfficialReport] = screen.getAllByRole('button', { name: 'Voir le PV associé' });
    await userEvent.click(seeOfficialReport);

    const [, , , officialReportRow] = screen.getAllByRole('row');
    expect(officialReportRow.className).toContain('bg-(--background-alt-blue-france)');
  });

  it('should name the highlighted documents to a screen reader', async () => {
    render(
      table([
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-siege',
          name: 'ODJ siège',
          officialReportId: 'pv-1',
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-parquet',
          name: 'ODJ parquet',
          officialReportId: 'pv-1',
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'pv-1',
          name: 'PV du 12 mars',
          outdated: false,
          status: 'VALIDATED',
          type: 'officialReport',
          validatedAt: VALIDATED_AT,
        },
      ]),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Voir les 2 ODJ associés' }));

    expect(screen.getByText('Documents associés : ODJ siège, ODJ parquet')).toBeInTheDocument();
  });

  it('should tell an agenda still waiting for its official report', () => {
    render(table(DOCS));

    expect(screen.getByText('pv attendu')).toBeVisible();
    expect(screen.getByText('À vérifier')).toBeVisible();
  });

  it('should badge the official report rather than the agendas it covers', () => {
    render(
      table([
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-siege',
          name: 'ODJ siège',
          officialReportId: 'pv-1',
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-parquet',
          name: 'ODJ parquet',
          officialReportId: 'pv-1',
          outdated: false,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'pv-1',
          name: 'PV du 12 mars',
          outdated: true,
          status: 'VALIDATED',
          type: 'officialReport',
          validatedAt: VALIDATED_AT,
        },
      ]),
    );

    expect(screen.getAllByText('À vérifier')).toHaveLength(1);
    expect(screen.queryByText('pv attendu')).not.toBeInTheDocument();
  });

  it('should badge the agenda when outdated', () => {
    render(
      table([
        {
          createdAt: CREATED_AT,
          hasDraft: false,
          id: 'agenda-siege',
          name: 'ODJ siège',
          officialReportId: null,
          outdated: true,
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
        },
      ]),
    );

    expect(screen.getAllByText('À vérifier')).toHaveLength(1);
  });
});
