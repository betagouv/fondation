import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { defineMessages, IntlProvider, type MessageDescriptor } from 'react-intl';
import { describe, expect, it } from 'vitest';

import { httpAssert } from '@/utils/http-exception';

import { type FailureReason, useRequestFailure } from './useRequestFailure';

const REASONS = defineMessages({
  refused: { defaultMessage: 'Une image pèse 5 Mo au plus.' },
});

function failureWith(status: number): unknown {
  try {
    httpAssert(new Response(null, { status }));
  } catch (exception) {
    return exception;
  }
}

function renderUseRequestFailure(reasons: Readonly<Partial<Record<FailureReason, MessageDescriptor>>>) {
  return renderHook(() => useRequestFailure(reasons), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <IntlProvider defaultLocale="fr" locale="fr">
        {children}
      </IntlProvider>
    ),
  }).result.current;
}

describe('useRequestFailure', () => {
  it('explains a refusal the caller knows, without suggesting to retry', () => {
    expect(renderUseRequestFailure(REASONS)(failureWith(400))).toBe('Une image pèse 5 Mo au plus.');
  });

  it('explains a file too large by itself, unless the caller does', () => {
    expect(renderUseRequestFailure({})(failureWith(413))).toBe('Le fichier dépasse 50 Mo.');
    expect(renderUseRequestFailure({ tooLarge: REASONS.refused })(failureWith(413))).toBe(
      'Une image pèse 5 Mo au plus.',
    );
  });

  it('suggests to retry a refusal the caller cannot explain', () => {
    expect(renderUseRequestFailure({})(failureWith(400))).toBe(
      'Réessayez et prévenez le support si cela persiste (code 400).',
    );
  });

  it('keeps a reason apart from a refusal', () => {
    expect(renderUseRequestFailure(REASONS)(failureWith(500))).toBe(
      'Réessayez et prévenez le support si cela persiste (code 500).',
    );
  });
});
