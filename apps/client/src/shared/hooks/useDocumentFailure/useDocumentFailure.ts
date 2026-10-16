import { defineMessages } from 'react-intl';

import { useRequestFailure } from '@/shared/hooks/useRequestFailure';

const REASONS = defineMessages({
  forbidden: { defaultMessage: `Vous n'avez pas les droits nécessaires pour le générer.` },
  missing: { defaultMessage: 'Le document est introuvable.' },
  timeout: { defaultMessage: 'La génération a pris trop de temps.' },
  unavailable: { defaultMessage: 'Le service de génération PDF est indisponible.' },
  unknown: { defaultMessage: 'Sa génération a échoué.' },
});

export function useDocumentFailure() {
  return useRequestFailure(REASONS);
}
