import { useCallback } from 'react';
import { useIntl } from 'react-intl';

import { useAttachmentFailureToast } from '@/shared/hooks/useAttachmentFailureToast';
import { useTab } from '@/shared/hooks/useTab';
import { useGenerateSummaryAttachmentPublicUrlMutation } from '@queries/summary.queries';

export function useOpenSummaryAttachment() {
  const { formatMessage } = useIntl();
  const notifyFailure = useAttachmentFailureToast();
  const tab = useTab();
  const { mutateAsync, isPending } = useGenerateSummaryAttachmentPublicUrlMutation();

  const open = useCallback(
    async (attachment: { fileId: string; name: string; nominationFileId: string; sessionId: string }) => {
      const attachmentTab = tab.openDeferred({
        message: formatMessage({ defaultMessage: 'Ouverture de la pièce jointe, merci de patienter...' }),
        title: attachment.name,
      });

      try {
        attachmentTab.settle(await mutateAsync(attachment));
      } catch (error) {
        attachmentTab.cancel();
        notifyFailure('open', attachment.name, error);
      }
    },
    [formatMessage, mutateAsync, notifyFailure, tab],
  );

  return { isPending, open };
}
