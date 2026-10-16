import { useCallback } from 'react';
import { defineMessages, useIntl, type MessageDescriptor } from 'react-intl';

import { HttpException } from '@/utils/http-exception';

export type FailureReason = 'forbidden' | 'missing' | 'timeout' | 'unavailable' | 'unknown';

const REASON_BY_STATUS: Record<number, FailureReason> = {
  403: 'forbidden',
  404: 'missing',
  503: 'unavailable',
};

const ADVICES = defineMessages({
  report: { defaultMessage: 'Prévenez le support (code {code}).' },
  retry: { defaultMessage: 'Réessayez et prévenez le support si cela persiste.' },
  retryWithCode: { defaultMessage: 'Réessayez et prévenez le support si cela persiste (code {code}).' },
});

function failureOf(error: unknown): { code: number | null; reason: FailureReason } {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return { code: null, reason: 'timeout' };
  }
  if (!(error instanceof HttpException)) return { code: null, reason: 'unknown' };

  return { code: error.statusCode, reason: REASON_BY_STATUS[error.statusCode] ?? 'unknown' };
}

/** retrying cannot bring back what is missing */
function adviceOf(failure: { code: number | null; reason: FailureReason }): MessageDescriptor {
  if (failure.reason === 'missing') return ADVICES.report;
  return Number.isFinite(failure.code) ? ADVICES.retryWithCode : ADVICES.retry;
}

export function useRequestFailure(reasons: Readonly<Partial<Record<FailureReason, MessageDescriptor>>>) {
  const { formatMessage } = useIntl();

  return useCallback(
    (error: unknown) => {
      const failure = failureOf(error);
      const reason = reasons[failure.reason];
      const advice = formatMessage(adviceOf(failure), { code: failure.code });

      return reason ? `${formatMessage(reason)} ${advice}` : advice;
    },
    [formatMessage, reasons],
  );
}
