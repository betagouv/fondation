import React from 'react';
import { generatePath, useNavigate, useParams } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useCreateOfficialReportMutation,
  useDetailsOfficialReportQuery,
  useUpdateOfficialReportMutation
} from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import { OfficialReportContext } from './OfficialReportContext';
import type { OfficialReport } from './OfficialReportContext.types';

export function OfficialReportProvider(props: React.PropsWithChildren) {
  const { sessionId = '', officialReportId = null } = useParams<{
    sessionId: string;
    officialReportId?: string;
  }>();
  const navigate = useNavigate();

  const createOfficialReport = useCreateOfficialReportMutation();
  const updateOfficialReport = useUpdateOfficialReportMutation(sessionId);

  const { data: session, isFetching: sessionFetching } = useDetailedNominationSessionQuery({ sessionId });
  const {
    data: officialReportMetadata,
    isFetching: officialReportMetadataFetching,
    isFetched: metadataFetched
  } = useDetailsOfficialReportQuery({ officialReportId });

  const [state, setState] = React.useState(null as OfficialReport | null);

  React.useEffect(() => {
    if (!officialReportMetadata) return;

    const { hours, minutes } = officialReportMetadata.sessionMeetingStartingTime;
    setState((s) => ({
      ...s,
      agendaId: officialReportMetadata.agendas[0],
      sessionMeetingDate: officialReportMetadata.sessionMeetingDate,
      sessionMeetingTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      hasRenunciation: officialReportMetadata.hasRenunciation,
      justiceDepartmentContactId: officialReportMetadata.justiceDepartmentContactId ?? '',
      chairmanId: officialReportMetadata.chairmanId ?? '',
      secretaryId: officialReportMetadata.secretaryId ?? '',
      memberIds: officialReportMetadata.members
    }));
  }, [officialReportMetadata]);

  const isFetching = React.useMemo(
    () =>
      sessionFetching ||
      officialReportMetadataFetching ||
      (metadataFetched && state?.chairmanId !== officialReportMetadata?.chairmanId),
    [sessionFetching, officialReportMetadataFetching, state, metadataFetched, officialReportMetadata]
  );

  const cancel = React.useCallback(
    () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId })),
    [navigate, sessionId]
  );

  const submit = React.useCallback(
    (metadata: OfficialReport) => {
      const [hours, minutes] = metadata.sessionMeetingTime.split(':').map(Number);

      const payload = {
        sessionMeetingDate: metadata.sessionMeetingDate,
        sessionMeetingTime: { hours, minutes },
        hasRenunciation: metadata.hasRenunciation,
        justiceDepartmentContactId: metadata.justiceDepartmentContactId,
        chairmanId: metadata.chairmanId,
        secretaryId: metadata.secretaryId,
        agendas: [metadata.agendaId],
        members: metadata.memberIds
      };

      if (officialReportId) {
        updateOfficialReport.mutate(
          { ...payload, officialReportId },
          {
            onSuccess: () =>
              navigate(generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW, { sessionId, officialReportId }))
          }
        );
      } else {
        createOfficialReport.mutate(
          { ...payload, sessionId },
          {
            onSuccess: ({ id: officialReportId }) =>
              navigate(generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW, { sessionId, officialReportId }))
          }
        );
      }
    },
    [officialReportId, createOfficialReport, updateOfficialReport, sessionId, navigate]
  );

  return (
    <OfficialReportContext
      value={{
        cancel,
        submit,
        officialReportId,
        report: state,
        session: { id: sessionId, formation: session?.formation ?? 'SIEGE' },
        isSubmitting: createOfficialReport.isPending || updateOfficialReport.isPending
      }}
    >
      {isFetching ? <span className="ri-loader-4-line animate-spin" /> : props.children}
    </OfficialReportContext>
  );
}
