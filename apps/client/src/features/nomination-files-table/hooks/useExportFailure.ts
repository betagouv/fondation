import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { useToasts } from '@/shared/ui/toast';

export function useExportFailure() {
  const { formatMessage } = useIntl();
  const toasts = useToasts();

  return useCallback(
    () =>
      toasts.error({
        description: formatMessage({
          defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
        }),
        title: formatMessage({ defaultMessage: `L'export n'a pas pu être téléchargé` }),
      }),
    [formatMessage, toasts],
  );
}
