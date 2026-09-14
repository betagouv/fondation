import { useState } from 'react';
import { Outlet, useParams } from 'react-router';

import { HeaderReportList } from '@/features/reports/components/HeaderReportList';
import { MemberSessionTabsBar } from '@/features/transparence/components/session/SessionTabs';
import { ArchiveBannerPortal } from '@/shared/components/banners';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import type { MemberSessionOutletContext } from './member-session-outlet-context.type';

export function MemberSessionLayout() {
  const { sessionId } = useParams();
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);

  const { data: session, isPending } = useDetailedNominationSessionQuery({ sessionId });

  if (isPending || !session) return null;

  return (
    <ArchiveBannerPortal isArchived={session.isArchived}>
      <HeaderReportList
        dateTransparence={session.date}
        dueDate={session.dueDate}
        formation={session.formation}
        transparency={session.name}
      />

      <div className="fr-mt-6v fr-mb-4v flex flex-col gap-y-4">
        <div className="min-h-10" ref={setFiltersSlot} />

        <MemberSessionTabsBar sessionId={session.id} />

        <Outlet context={{ filtersSlot, session } satisfies MemberSessionOutletContext} />
      </div>
    </ArchiveBannerPortal>
  );
}
