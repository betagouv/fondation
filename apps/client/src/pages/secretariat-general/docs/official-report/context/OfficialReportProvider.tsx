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
import type { OfficialReportMetadata, OfficialReportStep } from './OfficialReportContext.types';

const STEPS = {
  1: { index: 1, title: 'Métadonnées', nextTitle: 'Sélection des ordres du jour' },
  2: { index: 2, title: 'Sélection des ordres du jour' }
} as const satisfies Record<1 | 2, OfficialReportStep>;

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

  const [state, setState] = React.useState({
    stepIndex: 1 as 1 | 2,
    metadata: null as OfficialReportMetadata | null,
    agendaIds: undefined as string[] | undefined
  });

  React.useEffect(() => {
    if (!officialReportMetadata) return;

    const { hours, minutes } = officialReportMetadata.sessionMeetingStartingTime;
    setState((s) => ({
      ...s,
      agendaIds: officialReportMetadata.agendas,
      metadata: {
        sessionMeetingDate: officialReportMetadata.sessionMeetingDate,
        sessionMeetingTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
        hasRenunciation: officialReportMetadata.hasRenunciation,
        justiceDepartmentContactId: officialReportMetadata.justiceDepartmentContactId ?? '',
        chairmanId: officialReportMetadata.chairmanId ?? '',
        secretaryId: officialReportMetadata.secretaryId ?? '',
        memberIds: officialReportMetadata.members
      }
    }));
  }, [officialReportMetadata]);

  const isFetching = React.useMemo(
    () =>
      sessionFetching ||
      officialReportMetadataFetching ||
      (metadataFetched && state.metadata?.chairmanId !== officialReportMetadata?.chairmanId),
    [sessionFetching, officialReportMetadataFetching, state, metadataFetched, officialReportMetadata]
  );

  const goToMetadata = React.useCallback(() => setState((s) => ({ ...s, stepIndex: 1 })), []);

  const goToSelections = React.useCallback(
    (metadata: OfficialReportMetadata) => setState((s) => ({ ...s, metadata, stepIndex: 2 })),
    []
  );

  const cancel = React.useCallback(
    () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId })),
    [navigate, sessionId]
  );

  const submit = React.useCallback(
    (agendaIds: string[]) => {
      if (!state.metadata) return;

      const [hours, minutes] = state.metadata.sessionMeetingTime.split(':').map(Number);

      const payload = {
        sessionMeetingDate: state.metadata.sessionMeetingDate,
        sessionMeetingTime: { hours, minutes },
        hasRenunciation: state.metadata.hasRenunciation,
        justiceDepartmentContactId: state.metadata.justiceDepartmentContactId,
        chairmanId: state.metadata.chairmanId,
        secretaryId: state.metadata.secretaryId,
        agendas: agendaIds,
        members: state.metadata.memberIds
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
    [state, officialReportId, createOfficialReport, updateOfficialReport, sessionId, navigate]
  );

  return (
    <OfficialReportContext
      value={{
        officialReportId,
        agendaIds: state.agendaIds,
        step: STEPS[state.stepIndex],
        session: { id: sessionId, formation: session?.formation ?? 'SIEGE' },
        metadata: state.metadata,
        isSubmitting: createOfficialReport.isPending || updateOfficialReport.isPending,
        goToSelections,
        goToMetadata,
        submit,
        cancel
      }}
    >
      {isFetching ? <span className="ri-loader-4-line animate-spin" /> : props.children}
    </OfficialReportContext>
  );
}
