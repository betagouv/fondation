import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useState } from 'react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { frFormat } from '@/i18n/formats';
import { ToastProvider } from '@/shared/ui/toast';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import { makeSessionOutcomes } from '@/test-utils/factories/session-outcomes.factory';
import * as $api from '@api/sdk';
import type { FoundAgendaNominationFiles } from '@api/types';

import { AgendaFilesSelectionTable } from './AgendaFilesSelectionTable';

type AgendaFile = FoundAgendaNominationFiles['items'][number];

function makeAgendaFile(id: string, overrides: Partial<AgendaFile> = {}): AgendaFile {
  return {
    id,
    number: 1,
    magistrat: {
      id: `magistrat-${id}`,
      externalId: 1,
      name: 'Camille DURAND',
      position: { grade: 'I', label: null, functionId: null, jurisdictionId: null },
    },
    outcome: null,
    reporters: [
      {
        id: `reporter-${id}`,
        gender: 'FEMALE',
        firstName: 'Alice',
        lastName: 'MARTIN',
        fullTitledName: 'Alice MARTIN',
      },
    ],
    targetPosition: { grade: 'HH', label: null, functionId: null, jurisdictionId: null },
    ...overrides,
  } as AgendaFile;
}

function mockQueries(agenda: { items: AgendaFile[]; ineligible: FoundAgendaNominationFiles['ineligible'] }) {
  vi.spyOn($api.docs, 'findAgendaNominationFiles').mockResolvedValue({
    data: agenda,
  } as Awaited<ReturnType<typeof $api.docs.findAgendaNominationFiles>>);

  vi.spyOn($api.sessions, 'listNominationFiles').mockResolvedValue({
    data: {
      items: agenda.items.map(({ id }) =>
        makeSessionNominationFile({ id, content: { nomMagistrat: `Magistrat ${id}` } }),
      ),
      totalCount: agenda.items.length,
    },
  } as Awaited<ReturnType<typeof $api.sessions.listNominationFiles>>);
}

function TableUnderTest(props: {
  defaultSelectedFileIds?: readonly string[];
  onCancel: () => void;
  onSubmit: (fileIds: readonly string[]) => void;
}) {
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);

  return (
    <>
      <div ref={setActionsSlot} />
      <AgendaFilesSelectionTable
        actionsSlot={actionsSlot}
        defaultSelectedFileIds={props.defaultSelectedFileIds}
        formation="SIEGE"
        onCancel={props.onCancel}
        onSubmit={props.onSubmit}
        outcomes={makeSessionOutcomes('SIEGE')}
        renderSubmitLabel={() => 'Continuer'}
        sessionId="session-1"
      />
    </>
  );
}

function renderTable(props: { defaultSelectedFileIds?: readonly string[] } = {}) {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <IntlProvider defaultLocale="fr" formats={frFormat} locale="fr">
      <NuqsTestingAdapter>
        <QueryClientProvider client={client}>
          <ToastProvider>
            <TableUnderTest
              defaultSelectedFileIds={props.defaultSelectedFileIds}
              onCancel={onCancel}
              onSubmit={onSubmit}
            />
          </ToastProvider>
        </QueryClientProvider>
      </NuqsTestingAdapter>
    </IntlProvider>,
  );

  return { onCancel, onSubmit };
}

const selectAllCheckbox = () =>
  screen.getByRole('checkbox', { name: 'Sélectionner toutes les propositions éligibles' });

async function selectAllEligible() {
  await waitFor(() => expect(selectAllCheckbox()).toBeEnabled());

  await userEvent.click(selectAllCheckbox());
}

describe('AgendaFilesSelectionTable', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should select nothing when no file is already part of an agenda', async () => {
    mockQueries({
      items: [makeAgendaFile('dossier-1'), makeAgendaFile('dossier-2')],
      ineligible: [],
    });

    renderTable();

    expect(await screen.findByText('Aucune proposition sélectionnée')).toBeVisible();
  });

  it('should preselect the files of the agenda but never one that cannot join it', async () => {
    mockQueries({
      items: [makeAgendaFile('dossier-1'), makeAgendaFile('dossier-2')],
      ineligible: [{ id: 'dossier-2', reason: 'REPORTED' }],
    });

    renderTable({ defaultSelectedFileIds: ['dossier-1', 'dossier-2'] });

    expect(await screen.findByText('1 proposition sélectionnée sur 2')).toBeVisible();
  });

  it('should leave the files that cannot join an agenda out of a global selection', async () => {
    mockQueries({
      items: [makeAgendaFile('dossier-1'), makeAgendaFile('dossier-2')],
      ineligible: [{ id: 'dossier-2', reason: 'REPORTED' }],
    });

    renderTable();
    await selectAllEligible();

    expect(await screen.findByText('1 proposition sélectionnée sur 2')).toBeVisible();
  });

  it('should select every eligible file at once', async () => {
    mockQueries({
      items: [makeAgendaFile('dossier-1'), makeAgendaFile('dossier-2')],
      ineligible: [],
    });

    renderTable();
    await selectAllEligible();

    expect(await screen.findByText('2 propositions sélectionnées sur 2')).toBeVisible();
  });

  it('should refuse any selection when the eligible files cannot be loaded', async () => {
    vi.spyOn($api.docs, 'findAgendaNominationFiles').mockRejectedValue(new Error('unreachable'));
    vi.spyOn($api.sessions, 'listNominationFiles').mockResolvedValue({
      data: { items: [makeSessionNominationFile({ id: 'dossier-1' })], totalCount: 1 },
    } as Awaited<ReturnType<typeof $api.sessions.listNominationFiles>>);

    renderTable();

    expect(await screen.findByText('Impossible de savoir quelles propositions sont éligibles')).toBeVisible();
    expect(screen.getByText('Aucune proposition sélectionnée')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeDisabled();
  });

  it('should submit the selected files', async () => {
    mockQueries({ items: [makeAgendaFile('dossier-1')], ineligible: [] });

    const { onSubmit } = renderTable();

    await selectAllEligible();
    await userEvent.click(await screen.findByRole('button', { name: 'Continuer' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(['dossier-1']));
  });
});
