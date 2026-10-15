import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { useToasts } from '@/shared/ui/toast';
import { HttpException } from '@/utils/http-exception';

export function useDownloadFailureToast() {
  const { formatMessage } = useIntl();
  const toasts = useToasts();

  return useCallback(
    (name: string, error: unknown) => {
      if (error instanceof HttpException && error.statusCode === 404) {
        toasts.error({
          description: formatMessage({ defaultMessage: 'Prévenez le support.' }),
          title: formatMessage({ defaultMessage: '"{name}" est introuvable' }, { name }),
        });
        return;
      }

      toasts.error({
        description: formatMessage({ defaultMessage: 'Réessayez et prévenez le support si cela persiste.' }),
        title: formatMessage({ defaultMessage: 'Le téléchargement de "{name}" a échoué' }, { name }),
      });
    },
    [formatMessage, toasts],
  );
}
