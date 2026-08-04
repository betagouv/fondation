import { FormattedMessage } from 'react-intl';

import { NominationSessionAttachmentList } from '@/features/transparence/components/NominationSessionAttachmentList';
import { CountedPopover, EmptyPanel } from '@/features/transparence/components/TransparenceToolbar';
import { useListNominationSessionAttachmentsQuery } from '@queries/nomination-sessions.queries';

export function MemberSessionToolbar(props: { sessionId: string }) {
  const { data: attachments } = useListNominationSessionAttachmentsQuery({ sessionId: props.sessionId });
  const attachmentsCount = attachments?.items.length ?? 0;

  return (
    <div className="fr-py-2v fr-my-4v mx-[calc(50%-50vw)] bg-(--background-contrast-grey) px-[calc(50vw-50%)]">
      <CountedPopover count={attachmentsCount} label={<FormattedMessage defaultMessage="Pièces jointes" />}>
        {attachmentsCount ? (
          <NominationSessionAttachmentList placeholder={null} sessionId={props.sessionId} />
        ) : (
          <EmptyPanel>
            <FormattedMessage defaultMessage="Aucune pièce jointe." />
          </EmptyPanel>
        )}
      </CountedPopover>
    </div>
  );
}
