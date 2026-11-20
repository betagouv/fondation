import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  makeSessionNominationFile,
  type NominationFileOverrides,
} from '@/test-utils/factories/session-nomination-file.factory';

import { NominationFileTargetPositionCell } from './NominationFileTargetPositionCell';

const open = vi.fn();
const isSg = vi.fn();

vi.mock('./NominationFileTargetPositionContext', () => ({
  useNominationFileTargetPositionModal: () => ({ open }),
}));

vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSgNavigation: () => isSg() }));

const POSITION = { content: { posteCible: 'Procureur de la République TJ GRASSE' } };

function renderCell(overrides: NominationFileOverrides) {
  return render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <NominationFileTargetPositionCell nominationFile={makeSessionNominationFile(overrides)} />
    </IntlProvider>,
  );
}

/** only the alerted cell turns the position into a button, the plain one stays text */
const positionButton = () => screen.queryByRole('button', { name: /Procureur de la République TJ GRASSE/ });

beforeEach(() => {
  vi.clearAllMocks();
  isSg.mockReturnValue(true);
});

describe('NominationFileTargetPositionCell', () => {
  it('asks for the jurisdiction sheet the API requires, through the modal', async () => {
    const user = userEvent.setup();
    renderCell({ ...POSITION, jurisdictionSheetRequired: true });

    await user.click(positionButton()!);

    expect(open).toHaveBeenCalledWith(expect.objectContaining({ jurisdictionSheetRequired: true }));
  });

  it('shows the plain position when no sheet is required', () => {
    renderCell({ ...POSITION, jurisdictionSheetRequired: false });

    expect(positionButton()).not.toBeInTheDocument();
    expect(screen.getByText(/Procureur de la République TJ GRASSE/)).toBeInTheDocument();
  });

  it('shows the plain position in the member space, even to an admin the API asks for the sheet', () => {
    isSg.mockReturnValue(false);
    renderCell({ ...POSITION, jurisdictionSheetRequired: true });

    expect(positionButton()).not.toBeInTheDocument();
  });
});
