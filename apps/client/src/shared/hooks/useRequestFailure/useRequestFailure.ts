import { useCallback } from 'react';
import { defineMessages, useIntl, type MessageDescriptor } from 'react-intl';

import { HttpException } from '@/utils/http-exception';

export type FailureReason =
  | 'conflict'
  | 'forbidden'
  | 'missing'
  | 'offline'
  | 'refused'
  | 'timeout'
  | 'tooLarge'
  | 'unavailable'
  | 'unknown';

const REASON_BY_STATUS: Record<number, FailureReason> = {
  400: 'refused',
  403: 'forbidden',
  404: 'missing',
  409: 'conflict',
  413: 'tooLarge',
  502: 'unavailable',
  503: 'unavailable',
  504: 'unavailable',
};

const ADVICES = defineMessages({
  report: { defaultMessage: 'Prévenez le support (code {code}).' },
  retry: { defaultMessage: 'Réessayez et prévenez le support si cela persiste.' },
  retryWithCode: { defaultMessage: 'Réessayez et prévenez le support si cela persiste (code {code}).' },
});

const DEFAULT_REASONS: Readonly<Partial<Record<FailureReason, MessageDescriptor>>> = defineMessages({
  offline: { defaultMessage: 'La connexion a été interrompue.' },
  // see ATTACHMENT_MAX_BYTES in apps/api/src/modules/framework/files
  tooLarge: { defaultMessage: 'Le fichier dépasse 50 Mo.' },
  // a 503 may come from the PDF renderer as well as from the Scalingo router: the message names neither
  unavailable: { defaultMessage: 'Le service est momentanément indisponible.' },
});

export function failureOf(error: unknown): { code: number | null; reason: FailureReason } {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return { code: null, reason: 'timeout' };
  }
  // see createClientConfig: a dropped connection, told apart from a bug
  if (error instanceof DOMException && error.name === 'NetworkError') {
    return { code: null, reason: 'offline' };
  }
  if (!(error instanceof HttpException)) return { code: null, reason: 'unknown' };

  return { code: error.statusCode, reason: REASON_BY_STATUS[error.statusCode] ?? 'unknown' };
}

/** retrying cannot bring back what is missing, and a refusal the caller explains needs no advice */
function adviceOf(
  failure: { code: number | null; reason: FailureReason },
  explained: boolean,
): MessageDescriptor | null {
  if (['conflict', 'refused', 'tooLarge'].includes(failure.reason) && explained) return null;
  if (failure.reason === 'missing') return ADVICES.report;
  return Number.isFinite(failure.code) ? ADVICES.retryWithCode : ADVICES.retry;
}

export function useRequestFailure(reasons: Readonly<Partial<Record<FailureReason, MessageDescriptor>>> = {}) {
  const { formatMessage } = useIntl();

  return useCallback(
    (error: unknown) => {
      const failure = failureOf(error);
      const reason = reasons[failure.reason] ?? DEFAULT_REASONS[failure.reason];
      const advice = adviceOf(failure, !!reason);

      return [reason && formatMessage(reason), advice && formatMessage(advice, { code: failure.code })]
        .filter((part): part is string => !!part)
        .join(' ');
    },
    [formatMessage, reasons],
  );
}
