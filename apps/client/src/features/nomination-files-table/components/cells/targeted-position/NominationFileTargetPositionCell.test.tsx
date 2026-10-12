import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  makeSessionNominationFile,
  type NominationFileOverrides,
} from '@/test-utils/factories/session-nomination-file.factory';

import { NominationFileTargetPositionCell } from './NominationFileTargetPositionCell';

const isSg = vi.fn();
const open = vi.fn();

vi.mock('@/features/auth/hooks/roles.hook', () => ({ useIsSg: () => isSg() }));

vi.mock('./NominationFileTargetPositionContext', () => ({
  useNominationFileTargetPositionModal: () => ({ open }),
}));

const ALERTED_POSITION = { content: { posteCible: 'Procureur de la République TJ GRASSE' } };

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
  it('asks for a jurisdiction sheet on the positions that need one', () => {
    renderCell(ALERTED_POSITION);

    expect(positionButton()).toBeInTheDocument();
  });

  it('stops asking once a jurisdiction sheet is attached', () => {
    renderCell({ ...ALERTED_POSITION, hasJurisdictionSheet: true });

    expect(positionButton()).not.toBeInTheDocument();
  });

  it('keeps asking when the attached files are of another kind', () => {
    renderCell({ ...ALERTED_POSITION, hasAttachment: true });

    expect(positionButton()).toBeInTheDocument();
  });

  it('stops asking once the alert has been explicitly ignored', () => {
    renderCell({ content: { ...ALERTED_POSITION.content, isAlertHidden: true } });

    expect(positionButton()).not.toBeInTheDocument();
  });

  it('never asks outside of the secretariat général', () => {
    isSg.mockReturnValue(false);
    renderCell(ALERTED_POSITION);

    expect(positionButton()).not.toBeInTheDocument();
  });
});
