import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AgendaBasket } from '@/features/agenda/hooks/useAgendaBasket.hook';

import { NominationFilesSelectionBar } from './NominationFilesSelectionBar';

const readiness = { canCreateAgenda: true };

vi.mock('../context/files-table.context', () => ({
  useNominationFilesTable: () => ({ sessionId: 'session-1' }),
}));

vi.mock('@queries/agenda.queries', () => ({
  useIsSessionReadyForDocGenerationQuery: () => ({ data: readiness }),
}));

function renderBar(
  selectedFileIds = ['dossier-1', 'dossier-2'],
  options: { isFilteringBasket?: boolean } = {},
) {
  const add = vi.fn();
  const remove = vi.fn();
  const onClear = vi.fn();
  const onExit = vi.fn();
  const basket = { add, remove } as unknown as AgendaBasket;

  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <NominationFilesSelectionBar
        basket={basket}
        isFilteringBasket={options.isFilteringBasket ?? false}
        onClear={onClear}
        onExit={onExit}
        selectedFileIds={selectedFileIds}
      />
    </IntlProvider>,
  );

  return { add, onClear, onExit, remove };
}

describe('NominationFilesSelectionBar', () => {
  beforeEach(() => {
    readiness.canCreateAgenda = true;
  });

  it('should add the selected files to the agenda basket and leave the selection mode', async () => {
    const { add, onExit } = renderBar();

    expect(screen.getByText('2 propositions sélectionnées')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /Ajouter à l'ODJ/ }));

    expect(add).toHaveBeenCalledWith(['dossier-1', 'dossier-2']);
    expect(onExit).toHaveBeenCalled();
  });

  it('should drop the selection without touching the basket', async () => {
    const { add, onClear } = renderBar();

    await userEvent.click(screen.getByRole('button', { name: 'Tout désélectionner' }));

    expect(onClear).toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it('should leave the selection mode', async () => {
    const { onExit } = renderBar();

    await userEvent.click(screen.getByRole('button', { name: 'Quitter la sélection' }));

    expect(onExit).toHaveBeenCalled();
  });

  it('should wait for a selection before offering the agenda action', () => {
    renderBar([]);

    expect(screen.getByText('Aucune proposition sélectionnée')).toBeVisible();
    expect(screen.getByRole('button', { name: /Ajouter à l'ODJ/ })).toBeDisabled();
  });

  it('should take the selected files out of the agenda while the table is filtered on it', async () => {
    const { onExit, remove } = renderBar(['dossier-1'], { isFilteringBasket: true });

    expect(screen.queryByRole('button', { name: /Ajouter à l'ODJ/ })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /Retirer de l'ODJ/ }));

    expect(remove).toHaveBeenCalledWith(['dossier-1']);
    expect(onExit).toHaveBeenCalled();
  });

  it('should wait for a selection before taking files out of the agenda', () => {
    renderBar([], { isFilteringBasket: true });

    expect(screen.getByRole('button', { name: /Retirer de l'ODJ/ })).toBeDisabled();
  });

  it('should keep the agenda action reachable but inert when the session cannot host a new one', async () => {
    readiness.canCreateAgenda = false;
    const { add } = renderBar();

    const button = screen.getByRole('button', { name: /Ajouter à l'ODJ/ });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();

    await userEvent.click(button);

    expect(add).not.toHaveBeenCalled();
  });
});
