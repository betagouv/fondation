import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MagistratSearchResult, Observation } from '@queries/observations.queries';

import { ObservationForm } from './ObservationForm';

const createObservation = vi.fn();
const updateObservation = vi.fn();

let searchResults: MagistratSearchResult[] = [];

let linkableAttachments: { observationId: string; fileId: string; name: string }[] = [];

vi.mock('@queries/observations.queries', () => ({
  useCreateObservationMutation: () => ({ mutate: createObservation, reset: vi.fn(), error: null }),
  useUpdateObservationMutation: () => ({ mutate: updateObservation, reset: vi.fn(), error: null }),
  useSearchMagistratsQuery: () => ({ data: searchResults, isLoading: false }),
  useListObservationsAttachments: () => ({ data: { items: linkableAttachments } }),
}));

const PV = { observationId: 'other-observation', fileId: 'file-a', name: 'pv.pdf' };
const NOTE = { observationId: 'other-observation', fileId: 'file-b', name: 'note.pdf' };

const MARTIN: MagistratSearchResult = {
  currentPosition: 'Juge à Nantes',
  firstName: 'Léa',
  grade: null,
  id: 'magistrat-1',
  lastName: 'Martin',
  usedName: '',
};

const DUPONT: MagistratSearchResult = {
  currentPosition: 'Procureur à Rennes',
  firstName: 'Marc',
  grade: null,
  id: 'magistrat-2',
  lastName: 'Dupont',
  usedName: '',
};

const OBSERVATION: Observation = {
  createdAt: '2026-07-13',
  createdBy: { firstName: 'Anne', id: 'user-1', lastName: 'Roy' },
  dateReception: '2026-07-02T00:00:00.000Z',
  description: 'Observation initiale',
  files: [
    { id: 'file-1', name: 'courrier.pdf' },
    { id: 'file-2', name: 'annexe.docx' },
  ],
  followUp: null,
  id: 'observation-1',
  magistrat: {
    currentPosition: null,
    firstName: 'Léa',
    id: 'magistrat-1',
    lastName: 'Martin',
    usedName: null,
  },
};

function renderForm(observation?: Observation) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <ObservationForm
        nominationFileId="nomination-file"
        observation={observation}
        onPending={vi.fn()}
        sessionId="session-1"
      />
      <button form="observation-form" type="submit">
        Envoyer
      </button>
    </IntlProvider>,
  );
}

const removeFileButton = (name: string) =>
  screen.getByRole('button', { name: `Supprimer ${name}` }) as HTMLButtonElement;

const searchInput = () => screen.getByRole('combobox');

async function search(user: ReturnType<typeof userEvent.setup>) {
  await user.type(searchInput(), 'mar');
  return screen.findAllByRole('option');
}

beforeEach(() => {
  vi.clearAllMocks();
  searchResults = [];
  linkableAttachments = [];
});

describe('ObservationForm linkable attachments', () => {
  it('links an attachment coming from another observation', async () => {
    const user = userEvent.setup();
    linkableAttachments = [PV];
    renderForm(OBSERVATION);

    await user.click(screen.getByRole('button', { name: /pv\.pdf/ }));

    expect(screen.getByRole('button', { name: /pv\.pdf/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('unlinks one attachment without dropping the other one from the same observation', async () => {
    const user = userEvent.setup();
    linkableAttachments = [PV, NOTE];
    renderForm(OBSERVATION);

    await user.click(screen.getByRole('button', { name: /pv\.pdf/ }));
    await user.click(screen.getByRole('button', { name: /note\.pdf/ }));
    await user.click(screen.getByRole('button', { name: /pv\.pdf/ }));

    expect(screen.getByRole('button', { name: /pv\.pdf/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /note\.pdf/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('submits the linked attachments', async () => {
    const user = userEvent.setup();
    linkableAttachments = [PV, NOTE];
    renderForm(OBSERVATION);

    await user.click(screen.getByRole('button', { name: /note\.pdf/ }));
    await user.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(updateObservation).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedObservationsAttachments: [{ observationId: NOTE.observationId, fileId: NOTE.fileId }],
      }),
      expect.anything(),
    );
  });
});

describe('ObservationForm magistrat combobox', () => {
  it('exposes the results as options of a listbox', async () => {
    const user = userEvent.setup();
    searchResults = [MARTIN, DUPONT];
    renderForm();

    const options = await search(user);

    expect(options).toHaveLength(2);
    expect(searchInput()).toHaveAttribute('aria-expanded', 'true');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    expect(options[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('points aria-activedescendant at the option the arrow keys reach', async () => {
    const user = userEvent.setup();
    searchResults = [MARTIN, DUPONT];
    renderForm();

    const options = await search(user);
    await user.keyboard('{ArrowDown}');

    expect(searchInput()).toHaveAttribute('aria-activedescendant', options[1]!.id);
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('selects the active option with Enter', async () => {
    const user = userEvent.setup();
    searchResults = [MARTIN, DUPONT];
    renderForm();

    await search(user);
    await user.keyboard('{ArrowDown}{Enter}');

    expect(screen.getByText(/dupont/i)).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the listbox when the focus leaves the combobox', async () => {
    const user = userEvent.setup();
    searchResults = [MARTIN, DUPONT];
    renderForm();

    await search(user);
    await user.click(screen.getByLabelText(/Date de réception/));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the listbox with Escape', async () => {
    const user = userEvent.setup();
    searchResults = [MARTIN, DUPONT];
    renderForm();

    await search(user);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(searchInput()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('ObservationForm', () => {
  it('detaches the removed file and keeps the other one', async () => {
    const user = userEvent.setup();
    renderForm(OBSERVATION);

    await user.click(removeFileButton('courrier.pdf'));
    await user.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(updateObservation).toHaveBeenCalledWith(
      expect.objectContaining({ observationId: 'observation-1', detachFileIds: ['file-1'] }),
      expect.anything(),
    );
  });

  it('detaches nothing when the user removes no file', async () => {
    const user = userEvent.setup();
    renderForm(OBSERVATION);

    await user.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(updateObservation).toHaveBeenCalledWith(
      expect.objectContaining({ detachFileIds: [] }),
      expect.anything(),
    );
  });

  it('accepts an observation carrying only an attachment', async () => {
    const user = userEvent.setup();
    renderForm({ ...OBSERVATION, description: '' });

    await user.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(updateObservation).toHaveBeenCalled();
  });

  it('accepts an observation left without text nor attachment as the domain allows it', async () => {
    const user = userEvent.setup();
    renderForm({ ...OBSERVATION, description: '', files: [{ id: 'file-1', name: 'courrier.pdf' }] });

    await user.click(removeFileButton('courrier.pdf'));
    await user.click(screen.getByRole('button', { name: 'Envoyer' }));

    expect(updateObservation).toHaveBeenCalledWith(
      expect.objectContaining({ detachFileIds: ['file-1'] }),
      expect.anything(),
    );
  });
});
