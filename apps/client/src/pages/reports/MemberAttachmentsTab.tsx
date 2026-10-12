import { useOutletContext } from 'react-router';

import { SessionAttachmentsTab } from '@/features/transparence/components/attachments/SessionAttachmentsTab';

import type { MemberSessionOutletContext } from './member-session-outlet-context.type';

export function MemberAttachmentsTab() {
  const { filtersSlot, session, toolbarSlot } = useOutletContext<MemberSessionOutletContext>();

  return (
    <SessionAttachmentsTab
      filtersSlot={filtersSlot}
      scrollsWithPage
      sessionId={session.id}
      toolbarSlot={toolbarSlot}
    />
  );
}
