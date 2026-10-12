import { useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { HttpException } from '@/utils/http-exception';

const REASONS = defineMessages({
  forbidden: { defaultMessage: `Vous n'avez pas les droits nécessaires pour le générer.` },
  missing: { defaultMessage: 'Le document est introuvable.' },
  renderer: { defaultMessage: 'Le service de génération PDF est indisponible.' },
  timeout: { defaultMessage: 'La génération a pris trop de temps.' },
  unknown: { defaultMessage: 'Sa génération a échoué.' },
});

const REASON_BY_STATUS: Record<number, keyof typeof REASONS> = {
  403: 'forbidden',
  404: 'missing',
  503: 'renderer',
};

function failureOf(error: unknown): { code: string | null; reason: keyof typeof REASONS } {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return { code: null, reason: 'timeout' };
  }
  if (!(error instanceof HttpException)) return { code: null, reason: 'unknown' };

  return {
    code: String(error.statusCode),
    reason: REASON_BY_STATUS[error.statusCode] ?? 'unknown',
  };
}

export function useDocumentFailure() {
  const { formatMessage } = useIntl();

  return useCallback(
    (error: unknown) => {
      const { code, reason } = failureOf(error);
      const explanation = formatMessage(REASONS[reason]);

      if (!code) {
        return formatMessage(
          { defaultMessage: '{reason} Réessayez et prévenez le support si cela persiste.' },
          { reason: explanation },
        );
      }

      return formatMessage(
        { defaultMessage: '{reason} Réessayez et prévenez le support si cela persiste (code {code}).' },
        { code, reason: explanation },
      );
    },
    [formatMessage],
  );
}
