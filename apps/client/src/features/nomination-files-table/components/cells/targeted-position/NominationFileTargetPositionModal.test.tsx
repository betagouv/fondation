import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';

import { NominationFileTargetPositionModal } from './NominationFileTargetPositionModal';

const addAttachment = vi.fn();
const hideAlert = vi.fn();
const openSidePanel = vi.fn();
const success = vi.fn();

vi.mock('@queries/nomination-sessions.queries', () => ({
  useAddNominationFileAttachmentsMutation: () => ({ mutateAsync: addAttachment, isPending: false }),
  useNominationFilesAlertMutation: () => ({ mutateAsync: hideAlert, isPending: false }),
}));

vi.mock('@/shared/ui/toast', () => ({ useToasts: () => ({ success }) }));

vi.mock('../magistrat-side-panel/context/side-panel.context', () => ({
  useSidePanel: () => ({ open: openSidePanel }),
}));

const nominationFile = makeSessionNominationFile({ id: 'nomination-file-1' });

function renderModal() {
  const onClose = vi.fn();
  const view = render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <NominationFileTargetPositionModal
        nominationFile={nominationFile}
        onClose={onClose}
        onClosed={vi.fn()}
        open
        sessionId="session-1"
      />
    </IntlProvider>,
  );

  return { ...view, onClose };
}

async function importFile(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, new File(['data'], 'fiche.pdf', { type: 'application/pdf' }));
  await user.click(screen.getByRole('button', { name: 'Sauvegarder' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  addAttachment.mockResolvedValue(undefined);
  hideAlert.mockResolvedValue(undefined);
});

describe('NominationFileTargetPositionModal', () => {
  it('attaches the imported file to the nomination file as a jurisdiction sheet', async () => {
    const user = userEvent.setup();
    const { container } = renderModal();

    await importFile(container, user);

    await waitFor(() =>
      expect(addAttachment).toHaveBeenCalledWith(
        expect.objectContaining({
          nominationFileId: 'nomination-file-1',
          sessionId: 'session-1',
          type: 'FICHE_DE_JURIDICTION',
        }),
      ),
    );
  });

  it('tells where the imported file landed and opens the magistrat panel on demand', async () => {
    const user = userEvent.setup();
    const { container } = renderModal();

    await importFile(container, user);

    await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
    expect(success.mock.calls[0][0]).toMatchObject({
      description: 'À retrouver dans les pièces jointes du magistrat.',
      title: 'Fiche de juridiction importée',
    });

    success.mock.calls[0][0].action.onClick();
    expect(openSidePanel).toHaveBeenCalledWith('nomination-file-1');
  });

  it('leaves the alert alone on import, since the attached sheet is what silences it', async () => {
    const user = userEvent.setup();
    const { container, onClose } = renderModal();

    await importFile(container, user);

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(hideAlert).not.toHaveBeenCalled();
  });

  it('hides the alert for good when it is explicitly ignored', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Ignorer cette alerte' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(hideAlert).toHaveBeenCalledWith({ nominationFileId: 'nomination-file-1' });
  });

  it('keeps the alert when the import fails', async () => {
    const user = userEvent.setup();
    addAttachment.mockRejectedValue(new Error('upload failed'));
    const { container } = renderModal();

    await importFile(container, user);

    expect(await screen.findByText('Erreur pendant le téléchargement')).toBeInTheDocument();
    expect(success).not.toHaveBeenCalled();
    expect(hideAlert).not.toHaveBeenCalled();
  });
});
