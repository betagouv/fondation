import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  officialReportKeys,
  useCreateOfficialReportMutation,
  useDetailsOfficialReportQuery,
  useUpdateOfficialReportMutation,
} from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import { OfficialReportContext } from './OfficialReportContext';
import type { OfficialReport } from './OfficialReportContext.types';

export function OfficialReportProvider(props: PropsWithChildren) {
  const { sessionId = '', officialReportId = null } = useParams<{
    sessionId: string;
    officialReportId?: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createOfficialReport = useCreateOfficialReportMutation();
  const updateOfficialReport = useUpdateOfficialReportMutation(sessionId);

  const { data: session, isFetching: sessionFetching } = useDetailedNominationSessionQuery({
    sessionId,
  });
  const {
    data: officialReportMetadata,
    isFetching: officialReportMetadataFetching,
    isFetched: metadataFetched,
  } = useDetailsOfficialReportQuery({ officialReportId });

  const [state, setState] = useState(null as OfficialReport | null);

  useEffect(() => {
    if (!officialReportMetadata) return;

    setState((s) => ({
      ...s,
      agendaId: officialReportMetadata.agendas[0],
      sessionMeetingDate: officialReportMetadata.sessionMeetingDate,
      sessionMeetingStartingTime: officialReportMetadata.sessionMeetingStartingTime,
      sessionMeetingEndingTime: officialReportMetadata.sessionMeetingEndingTime,
      hasRenunciation: officialReportMetadata.hasRenunciation,
      justiceContactId: officialReportMetadata.justiceDepartmentContactId ?? '',
      chairmanId: officialReportMetadata.chairmanId ?? '',
      secretaryId: officialReportMetadata.secretaryId ?? '',
      memberIds: officialReportMetadata.absentMembers,
    }));
  }, [officialReportMetadata]);

  const isFetching = useMemo(
    () =>
      sessionFetching ||
      officialReportMetadataFetching ||
      (metadataFetched && state?.chairmanId !== officialReportMetadata?.chairmanId),
    [sessionFetching, officialReportMetadataFetching, state, metadataFetched, officialReportMetadata],
  );

  const cancel = useCallback(
    () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId })),
    [navigate, sessionId],
  );

  const submit = useCallback(
    async (metadata: OfficialReport) => {
      const payload = {
        sessionMeetingDate: metadata.sessionMeetingDate,
        sessionMeetingTime: metadata.sessionMeetingStartingTime,
        sessionMeetingEndingTime: metadata.sessionMeetingEndingTime,
        hasRenunciation: metadata.hasRenunciation,
        justiceDepartmentContactId: metadata.justiceContactId,
        chairmanId: metadata.chairmanId,
        secretaryId: metadata.secretaryId,
        agendas: [metadata.agendaId],
        members: metadata.memberIds,
      };

      async function onSuccess(result: { id: string } | undefined) {
        const id = result?.id || officialReportId;
        if (id) {
          await queryClient.invalidateQueries({ queryKey: officialReportKeys.document(id) });
          await queryClient.invalidateQueries({ queryKey: officialReportKeys.html(id) });
          return navigate(
            generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW, {
              sessionId,
              officialReportId: id,
            }),
          );
        }
      }

      if (officialReportId) {
        updateOfficialReport.mutate({ ...payload, officialReportId }, { onSuccess });
      } else {
        createOfficialReport.mutate({ ...payload, sessionId }, { onSuccess });
      }
    },
    [officialReportId, createOfficialReport, updateOfficialReport, sessionId, navigate, queryClient],
  );

  return (
    <OfficialReportContext
      value={{
        cancel,
        submit,
        officialReportId,
        report: state,
        session: { id: sessionId, formation: session?.formation ?? 'SIEGE' },
        isSubmitting: createOfficialReport.isPending || updateOfficialReport.isPending,
      }}
    >
      {isFetching ? <span className="ri-loader-4-line animate-spin" /> : props.children}
    </OfficialReportContext>
  );
}
