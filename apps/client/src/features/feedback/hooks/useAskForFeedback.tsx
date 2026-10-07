import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useConfirmModal } from '@/shared/context/confirm-modal';

export function useAskForFeedback() {
  const { formatMessage } = useIntl();
  const { waitForConfirmation } = useConfirmModal();

  return useCallback(
    () =>
      waitForConfirmation({
        content: (
          <>
            <p className="fr-mb-2v">
              <FormattedMessage defaultMessage="Votre retour sur l'utilisation de Fondation permettra d'en améliorer le fonctionnement." />
            </p>
            <p className="fr-mb-4v">
              <FormattedMessage defaultMessage="Ce questionnaire demande environ deux minutes." />
            </p>
            <p className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
              <FormattedMessage defaultMessage="Vos réponses sont exploitées sous un numéro, sans que votre nom y figure." />
            </p>
          </>
        ),
        i18n: {
          cancel: formatMessage({ defaultMessage: 'Répondre ultérieurement' }),
          confirm: formatMessage({ defaultMessage: 'Répondre au questionnaire' }),
        },
        title: formatMessage({ defaultMessage: 'Votre avis sur Fondation' }),
      }).then(({ isConfirmed }) => isConfirmed),
    [formatMessage, waitForConfirmation],
  );
}
