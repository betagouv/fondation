import { useCallback } from 'react';
import { defineMessages, useIntl, type MessageDescriptor } from 'react-intl';

import { HttpException } from '@/utils/http-exception';

export type FailureReason =
  | 'forbidden'
  | 'missing'
  | 'refused'
  | 'timeout'
  | 'tooLarge'
  | 'unavailable'
  | 'unknown';

const REASON_BY_STATUS: Record<number, FailureReason> = {
  400: 'refused',
  403: 'forbidden',
  404: 'missing',
  413: 'tooLarge',
  503: 'unavailable',
};

const ADVICES = defineMessages({
  report: { defaultMessage: 'Prévenez le support (code {code}).' },
  retry: { defaultMessage: 'Réessayez et prévenez le support si cela persiste.' },
  retryWithCode: { defaultMessage: 'Réessayez et prévenez le support si cela persiste (code {code}).' },
});

// see ATTACHMENT_MAX_BYTES in apps/api/src/modules/framework/files
const DEFAULT_REASONS: Readonly<Partial<Record<FailureReason, MessageDescriptor>>> = defineMessages({
  tooLarge: { defaultMessage: 'Le fichier dépasse 50 Mo.' },
});

function failureOf(error: unknown): { code: number | null; reason: FailureReason } {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return { code: null, reason: 'timeout' };
  }
  if (!(error instanceof HttpException)) return { code: null, reason: 'unknown' };

  return { code: error.statusCode, reason: REASON_BY_STATUS[error.statusCode] ?? 'unknown' };
}

/** retrying cannot bring back what is missing, and a refusal the caller explains needs no advice */
function adviceOf(
  failure: { code: number | null; reason: FailureReason },
  explained: boolean,
): MessageDescriptor | null {
  if ((failure.reason === 'refused' || failure.reason === 'tooLarge') && explained) return null;
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
