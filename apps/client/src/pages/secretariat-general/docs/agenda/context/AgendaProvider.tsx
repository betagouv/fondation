import React from 'react';
import { generatePath, useNavigate, useParams } from 'react-router';

import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useCreateAgendaMutation,
  useDetailsAgendaMetadataQuery,
  useUpdateAgendaMutation
} from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';
import { AgendaContext } from './AgendaContext';
import type { AgendaMetadata, AgendaStep } from './AgendaContext.types';

const STEPS = {
  1: { index: 1, title: 'Métadonnées', nextTitle: 'Sélection des propositions' },
  2: { index: 2, title: 'Sélection des propositions' }
} as const satisfies Record<1 | 2, AgendaStep>;

export function AgendaProvider(props: React.PropsWithChildren) {
  const { sessionId = '', agendaId = null } = useParams<{ sessionId: string; agendaId?: string }>();
  const navigate = useNavigate();
  const { waitForConfirmation } = useConfirmation();

  const createAgenda = useCreateAgendaMutation();
  const updateAgenda = useUpdateAgendaMutation(sessionId);

  const { data: session, isFetching: sessionFetching } = useDetailedNominationSessionQuery({ sessionId });
  const {
    data: agendaMetadata,
    isFetching: agendaMetadataFetching,
    isFetched: metadataFetched
  } = useDetailsAgendaMetadataQuery({
    agendaId
  });

  const [state, setState] = React.useState<{ stepIndex: 1 | 2; metadata: AgendaMetadata | null }>({
    stepIndex: 1,
    metadata: null
  });

  React.useEffect(() => {
    setState((s) => ({ ...s, metadata: (agendaMetadata as AgendaMetadata | undefined) ?? null }));
  }, [agendaMetadata]);

  const isFetching = React.useMemo(
    () =>
      sessionFetching ||
      agendaMetadataFetching ||
      (metadataFetched && state.metadata?.chairmanId !== agendaMetadata?.chairmanId),
    [sessionFetching, agendaMetadataFetching, state, metadataFetched, agendaMetadata]
  );

  const goToMetadata = React.useCallback(() => setState((s) => ({ ...s, stepIndex: 1 })), [setState]);
  const goToNominationFiles = React.useCallback(
    (metadata: AgendaMetadata) => {
      setState({ metadata, stepIndex: 2 });
    },
    [setState]
  );

  const cancel = React.useCallback(
    () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId })),
    [navigate, sessionId]
  );

  const submit = React.useCallback(
    async (nominationFileIds: string[]) => {
      if (!state.metadata) {
        const { isConfirmed } = await waitForConfirmation({
          title: 'Métadonnées manquantes',
          content: 'Merci de renseigner les métadonnées avant de continuer',
          i18n: { confirm: "Retourner à l'étape 1", cancel: 'Rester sur cette étape' }
        });
        if (isConfirmed) goToMetadata();
        return;
      }

      const payload = {
        nominationFileIds,
        chairmanId: state.metadata.chairmanId,
        date: state.metadata.date,
        sessionMeetingDate: state.metadata.sessionMeetingDate
      };

      if (agendaId) {
        updateAgenda.mutate(
          {
            ...payload,
            agendaId
          },
          { onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { sessionId, agendaId })) }
        );
      } else {
        createAgenda.mutate(
          {
            ...payload,
            sessionId
          },
          {
            onSuccess: ({ id: agendaId }) =>
              navigate(generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { sessionId, agendaId }))
          }
        );
      }
    },
    [state, goToMetadata, createAgenda, updateAgenda, agendaId, sessionId, navigate, waitForConfirmation]
  );

  return (
    <AgendaContext
      value={{
        agendaId,
        step: STEPS[state.stepIndex],
        session: {
          id: sessionId,
          dueDate: session?.dueDate ?? null,
          formation: session?.formation ?? 'SIEGE'
        },
        metadata: state.metadata,
        isSubmitting: createAgenda.isPending,
        goToNominationFiles,
        goToMetadata,
        submit,
        cancel
      }}
    >
      {isFetching ? <span className="ri-loader-4-line animate-spin" /> : props.children}
    </AgendaContext>
  );
}
