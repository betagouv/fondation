import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { httpAssert } from '@/utils/http-exception';

import { useAttachmentFailureToast } from './useAttachmentFailureToast';

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

function renderUseAttachmentFailureToast() {
  return renderHook(() => useAttachmentFailureToast(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <IntlProvider defaultLocale="fr" locale="fr">
        {children}
      </IntlProvider>
    ),
  }).result.current;
}

describe('useAttachmentFailureToast', () => {
  beforeEach(() => error.mockClear());

  it('tells the attachment is missing, without suggesting to retry', () => {
    renderUseAttachmentFailureToast()('download', 'courrier.pdf', failureWith(404));

    expect(error).toHaveBeenCalledWith({
      description: 'La pièce jointe est introuvable. Prévenez le support (code 404).',
      title: 'Le téléchargement de "courrier.pdf" a échoué',
    });
  });

  it('tells a download took too long', () => {
    renderUseAttachmentFailureToast()('download', 'courrier.pdf', new DOMException('', 'TimeoutError'));

    expect(error).toHaveBeenCalledWith({
      description:
        'Le serveur a mis trop de temps à répondre. Réessayez et prévenez le support si cela persiste.',
      title: 'Le téléchargement de "courrier.pdf" a échoué',
    });
  });

  it('suggests to retry any other failure of an opening', () => {
    renderUseAttachmentFailureToast()('open', 'courrier.pdf', failureWith(500));

    expect(error).toHaveBeenCalledWith({
      description: 'Réessayez et prévenez le support si cela persiste (code 500).',
      title: 'L\'ouverture de "courrier.pdf" a échoué',
    });
  });
});
