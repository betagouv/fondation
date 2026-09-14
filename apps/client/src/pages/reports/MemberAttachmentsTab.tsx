import { useOutletContext } from 'react-router';

import { SessionAttachmentsTab } from '@/features/transparence/components/attachments/SessionAttachmentsTab';

import type { MemberSessionOutletContext } from './member-session-outlet-context.type';

export function MemberAttachmentsTab() {
  const { filtersSlot, session } = useOutletContext<MemberSessionOutletContext>();

  return <SessionAttachmentsTab filtersSlot={filtersSlot} sessionId={session.id} />;
}
