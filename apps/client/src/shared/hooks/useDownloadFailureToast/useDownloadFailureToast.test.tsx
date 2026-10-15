import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { httpAssert } from '@/utils/http-exception';

import { useDownloadFailureToast } from './useDownloadFailureToast';

const error = vi.fn();

vi.mock('@/shared/ui/toast', () => ({
  useToasts: () => ({ error }),
}));

function failureWith(status: number): unknown {
  try {
    httpAssert(new Response(null, { status }));
  } catch (exception) {
    return exception;
  }
}

function renderUseDownloadFailureToast() {
  return renderHook(() => useDownloadFailureToast(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <IntlProvider defaultLocale="fr" locale="fr">
        {children}
      </IntlProvider>
    ),
  }).result.current;
}

describe('useDownloadFailureToast', () => {
  beforeEach(() => error.mockClear());

  it('tells the attachment is missing, without suggesting to retry', () => {
    renderUseDownloadFailureToast()('courrier.pdf', failureWith(404));

    expect(error).toHaveBeenCalledWith({
      description: 'Prévenez le support.',
      title: '"courrier.pdf" est introuvable',
    });
  });

  it('suggests to retry any other failure', () => {
    renderUseDownloadFailureToast()('courrier.pdf', failureWith(500));

    expect(error).toHaveBeenCalledWith({
      description: 'Réessayez et prévenez le support si cela persiste.',
      title: 'Le téléchargement de "courrier.pdf" a échoué',
    });
  });
});
