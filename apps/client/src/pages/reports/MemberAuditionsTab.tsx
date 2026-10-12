import { useOutletContext } from 'react-router';

import { SessionAuditionsTable } from '@/features/transparence/components/auditions/SessionAuditionsTable';

import type { MemberSessionOutletContext } from './member-session-outlet-context.type';

export function MemberAuditionsTab() {
  const { filtersSlot, session, toolbarSlot } = useOutletContext<MemberSessionOutletContext>();

  return (
    <SessionAuditionsTable
      canManage={false}
      context="membre"
      filtersSlot={filtersSlot}
      formation={session.formation}
      outcomes={session.outcomes}
      sessionId={session.id}
      toolbarSlot={toolbarSlot}
    />
  );
}
