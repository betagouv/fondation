import React from 'react';
import { generatePath, useNavigate, useParams } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useCreateOfficialReportMutation } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import { OfficialReportContext } from './OfficialReportContext';
import type { OfficialReportMetadata, OfficialReportStep } from './OfficialReportContext.types';

const STEPS = {
  1: { index: 1, title: 'Métadonnées', nextTitle: 'Sélection des ordres du jour' },
  2: { index: 2, title: 'Sélection des ordres du jour' }
} as const satisfies Record<1 | 2, OfficialReportStep>;

export function OfficialReportProvider(props: React.PropsWithChildren) {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const createOfficialReport = useCreateOfficialReportMutation();
  const { data: session, isFetching: sessionFetching } = useDetailedNominationSessionQuery({ sessionId });

  const [state, setState] = React.useState<{ stepIndex: 1 | 2; metadata: OfficialReportMetadata | null }>({
    stepIndex: 1,
    metadata: null
  });

  const goToMetadata = React.useCallback(() => setState((s) => ({ ...s, stepIndex: 1 })), []);

  const goToSelections = React.useCallback(
    (metadata: OfficialReportMetadata) => setState({ metadata, stepIndex: 2 }),
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

      createOfficialReport.mutate(
        {
          sessionId,
          sessionMeetingDate: state.metadata.sessionMeetingDate,
          sessionMeetingTime: { hours, minutes },
          hasRenunciation: state.metadata.hasRenunciation,
          justiceDepartmentContactId: state.metadata.justiceDepartmentContactId,
          chairmanId: state.metadata.chairmanId,
          secretaryId: state.metadata.secretaryId,
          agendas: agendaIds,
          members: state.metadata.memberIds
        },
        // TODO: move to html validation
        { onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId })) }
      );
    },
    [state, createOfficialReport, sessionId, navigate]
  );

  return (
    <OfficialReportContext
      value={{
        step: STEPS[state.stepIndex],
        session: { id: sessionId, formation: session?.formation ?? 'SIEGE' },
        metadata: state.metadata,
        isSubmitting: createOfficialReport.isPending,
        goToSelections,
        goToMetadata,
        submit,
        cancel
      }}
    >
      {sessionFetching ? <span className="ri-loader-4-line animate-spin" /> : props.children}
    </OfficialReportContext>
  );
}
