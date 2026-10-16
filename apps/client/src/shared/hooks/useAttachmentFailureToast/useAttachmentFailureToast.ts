import { useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useRequestFailure } from '@/shared/hooks/useRequestFailure';
import { useToasts } from '@/shared/ui/toast';

const TITLES = defineMessages({
  download: { defaultMessage: 'Le téléchargement de "{name}" a échoué' },
  open: { defaultMessage: 'L\'ouverture de "{name}" a échoué' },
});

const REASONS = defineMessages({
  forbidden: { defaultMessage: `Vous n'avez pas les droits nécessaires pour y accéder.` },
  missing: { defaultMessage: 'La pièce jointe est introuvable.' },
  timeout: { defaultMessage: 'Le serveur a mis trop de temps à répondre.' },
  unavailable: { defaultMessage: 'Le service est momentanément indisponible.' },
});

export function useAttachmentFailureToast() {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const describeFailure = useRequestFailure(REASONS);

  return useCallback(
    (action: keyof typeof TITLES, name: string, error: unknown) =>
      toasts.error({
        description: describeFailure(error),
        title: formatMessage(TITLES[action], { name }),
      }),
    [describeFailure, formatMessage, toasts],
  );
}
