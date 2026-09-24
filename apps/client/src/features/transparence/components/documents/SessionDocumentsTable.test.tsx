import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';

import { groupSessionDocuments, type AgendaDocument } from './session-document-groups';
import { SessionDocumentsTable, type SessionDocument } from './SessionDocumentsTable';

vi.mock('@queries/auth.queries', () => ({ useUser: () => ({ user: { id: 'me' } }) }));

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
    createdBy: null,
    draftChangesBy: null,
    draftUpdate: null,
    id: 'agenda-1',
    meetingDate: { day: 12, month: 3, year: 2028 },
    name: 'Ordre du jour du 12 mars',
    officialReportId: null,
    officialReportReadiness: { status: 'READY' },
    outdated: false,
    presentationPlans: [],
    status: 'VALIDATED',
    type: 'agenda',
    validatedAt: VALIDATED_AT,
    validatedBy: null,
  },
  {
    createdAt: '2028-03-13T09:00:00.000Z',
    createdBy: null,
    draftChangesBy: null,
    draftUpdate: null,
    id: 'pv-1',
    meetingDate: { day: 12, month: 3, year: 2028 },
    name: 'Procès-verbal du 12 mars',
    outdated: true,
    status: 'VALIDATED',
    type: 'officialReport',
    validatedAt: '2028-03-13T11:00:00.000Z',
    validatedBy: null,
  },
];

function table(
  docs: readonly SessionDocument[],
  renderName?: (doc: SessionDocument) => ReactNode,
  newOfficialReport?: (agenda: AgendaDocument) => ReactNode,
) {
  return (
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <SessionDocumentsTable
        groups={groupSessionDocuments(docs)}
        newOfficialReport={newOfficialReport}
        renderName={renderName}
      />
    </IntlProvider>
  );
}

const rowTexts = () =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent);

describe('SessionDocumentsTable', () => {
  describe('the state of a document', () => {
    const [agenda] = DOCS;

    it('should call a document never validated a draft', () => {
      render(table([{ ...agenda!, status: 'DRAFT', validatedAt: null }]));

      expect(screen.getByText('brouillon')).toBeInTheDocument();
    });

    it('should call a validated document with nothing pending validated', () => {
      render(table([agenda!]));

      expect(screen.getByText('validé')).toBeInTheDocument();
    });

    it.each(['PERSON', 'SYSTEM', 'PERSON_AND_SYSTEM'] as const)(
      'should say changes are in progress whoever opened the draft (%s)',
      (draftChangesBy) => {
        render(table([{ ...agenda!, draftChangesBy }]));

        expect(screen.getByText('modifications en cours')).toBeInTheDocument();
        expect(screen.queryByText('validé')).not.toBeInTheDocument();
      },
    );
  });

  it('should date both the validation and the last change of a draft opened on it', () => {
    const [agenda] = DOCS;
    render(
      table([
        {
          ...agenda!,
          draftChangesBy: 'PERSON',
          draftUpdate: { at: '2028-03-12T15:30:00.000Z', by: null, causes: [], origin: 'PERSON' },
        },
      ]),
    );

    expect(rowTexts()).toEqual([expect.stringMatching(/Validé le 10\/03\/2028.*Modifié le 12\/03\/2028/)]);
  });

  it('should say why the application updated a draft', () => {
    const [agenda] = DOCS;
    render(
      table([
        {
          ...agenda!,
          draftChangesBy: 'SYSTEM',
          draftUpdate: {
            at: '2028-03-12T15:30:00.000Z',
            by: null,
            causes: ['REPORTERS', 'AGENDA_TEXT'],
            origin: 'SYSTEM',
          },
        },
      ]),
    );

    expect(rowTexts()).toEqual([
      expect.stringContaining(
        "Mis à jour automatiquement suite au changement de rapporteurs et à la modification du texte d'une proposition dans l'ordre du jour, la dernière fois le 12/03/2028",
      ),
    ]);
  });

  it('should name who created a document, and say "vous" for whoever reads it', () => {
    const [agenda] = DOCS;
    render(
      table([
        {
          ...agenda!,
          createdBy: { id: 'user-1', name: 'Camille Martin' },
          validatedBy: { id: 'me', name: 'Lucas Bernard' },
        },
      ]),
    );

    expect(rowTexts()).toEqual([
      expect.stringMatching(/Créé le .* par Camille Martin.*Validé le 10\/03\/2028 à \d{2}h\d{2} par vous/),
    ]);
  });

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

  it('should show a meeting on a single row, its agendas beside their official report', () => {
    render(
      table([
        {
          createdAt: CREATED_AT,
          createdBy: null,
          draftChangesBy: null,
          draftUpdate: null,
          id: 'agenda-siege',
          meetingDate: { day: 12, month: 3, year: 2028 },
          name: 'ODJ siège',
          officialReportId: 'pv-1',
          officialReportReadiness: null,
          outdated: false,
          presentationPlans: [],
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
          validatedBy: null,
        },
        {
          createdAt: CREATED_AT,
          createdBy: null,
          draftChangesBy: null,
          draftUpdate: null,
          id: 'agenda-orphan',
          meetingDate: { day: 12, month: 3, year: 2028 },
          name: 'ODJ sans PV',
          officialReportId: null,
          officialReportReadiness: { status: 'READY' },
          outdated: false,
          presentationPlans: [],
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
          validatedBy: null,
        },
        {
          createdAt: CREATED_AT,
          createdBy: null,
          draftChangesBy: null,
          draftUpdate: null,
          id: 'agenda-parquet',
          meetingDate: { day: 12, month: 3, year: 2028 },
          name: 'ODJ parquet',
          officialReportId: 'pv-1',
          officialReportReadiness: null,
          outdated: false,
          presentationPlans: [],
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
          validatedBy: null,
        },
        {
          createdAt: CREATED_AT,
          createdBy: null,
          draftChangesBy: null,
          draftUpdate: null,
          id: 'pv-1',
          meetingDate: { day: 12, month: 3, year: 2028 },
          name: 'PV du 12 mars',
          outdated: false,
          status: 'VALIDATED',
          type: 'officialReport',
          validatedAt: VALIDATED_AT,
          validatedBy: null,
        },
      ]),
    );

    expect(rowTexts()).toEqual([
      expect.stringMatching(/ODJ siège.*ODJ parquet.*PV du 12 mars/),
      expect.stringContaining('ODJ sans PV'),
    ]);
  });

  it('should tell an agenda still waiting for its official report', () => {
    render(table(DOCS));

    expect(screen.getByText('pv attendu')).toBeVisible();
    expect(screen.getByText('À vérifier')).toBeVisible();
  });

  it('should offer to generate the official report an agenda is waiting for', () => {
    render(
      table(DOCS, undefined, (agenda) => (
        <button type="button">Générer le procès-verbal de {agenda.name}</button>
      )),
    );

    expect(
      screen.getByRole('button', { name: 'Générer le procès-verbal de Ordre du jour du 12 mars' }),
    ).toBeVisible();
  });

  it('should list the newest meeting first, and the oldest on demand', async () => {
    const [agenda] = DOCS;
    render(
      table([
        { ...agenda!, id: 'agenda-march', meetingDate: { day: 12, month: 3, year: 2028 }, name: 'ODJ mars' },
        {
          ...agenda!,
          id: 'agenda-january',
          meetingDate: { day: 8, month: 1, year: 2028 },
          name: 'ODJ janvier',
        },
      ]),
    );

    expect(rowTexts()).toEqual([expect.stringContaining('ODJ mars'), expect.stringContaining('ODJ janvier')]);

    await userEvent.click(screen.getByRole('button', { name: /Séance de restitution/ }));

    expect(rowTexts()).toEqual([expect.stringContaining('ODJ janvier'), expect.stringContaining('ODJ mars')]);
  });

  it('should badge the official report rather than the agendas it covers', () => {
    render(
      table([
        {
          createdAt: CREATED_AT,
          createdBy: null,
          draftChangesBy: null,
          draftUpdate: null,
          id: 'agenda-siege',
          meetingDate: { day: 12, month: 3, year: 2028 },
          name: 'ODJ siège',
          officialReportId: 'pv-1',
          officialReportReadiness: null,
          outdated: false,
          presentationPlans: [],
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
          validatedBy: null,
        },
        {
          createdAt: CREATED_AT,
          createdBy: null,
          draftChangesBy: null,
          draftUpdate: null,
          id: 'agenda-parquet',
          meetingDate: { day: 12, month: 3, year: 2028 },
          name: 'ODJ parquet',
          officialReportId: 'pv-1',
          officialReportReadiness: null,
          outdated: false,
          presentationPlans: [],
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
          validatedBy: null,
        },
        {
          createdAt: CREATED_AT,
          createdBy: null,
          draftChangesBy: null,
          draftUpdate: null,
          id: 'pv-1',
          meetingDate: { day: 12, month: 3, year: 2028 },
          name: 'PV du 12 mars',
          outdated: true,
          status: 'VALIDATED',
          type: 'officialReport',
          validatedAt: VALIDATED_AT,
          validatedBy: null,
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
          createdBy: null,
          draftChangesBy: null,
          draftUpdate: null,
          id: 'agenda-siege',
          meetingDate: { day: 12, month: 3, year: 2028 },
          name: 'ODJ siège',
          officialReportId: null,
          officialReportReadiness: { status: 'READY' },
          outdated: true,
          presentationPlans: [],
          status: 'VALIDATED',
          type: 'agenda',
          validatedAt: VALIDATED_AT,
          validatedBy: null,
        },
      ]),
    );

    expect(screen.getAllByText('À vérifier')).toHaveLength(1);
  });
});
