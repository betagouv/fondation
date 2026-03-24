import React from 'react';
import { generatePath, useNavigate, useParams } from 'react-router';

import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useCreateAgendaMutation } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';
import { NewAgendaContext } from './NewAgendaContext';
import type { AgendaMetadata, AgendaStep } from './NewAgendaContext.types';

const STEPS = {
  1: { index: 1, title: 'Métadonnées', nextTitle: 'Sélection des propositions' },
  2: { index: 2, title: 'Sélection des propositions' }
} as const satisfies Record<1 | 2, AgendaStep>;

export function NewAgendaProvider(props: React.PropsWithChildren) {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { waitForConfirmation } = useConfirmation();

  const createAgenda = useCreateAgendaMutation();
  const { data: session } = useDetailedNominationSessionQuery({ sessionId });

  const [state, setState] = React.useState<{ stepIndex: 1 | 2; metadata: AgendaMetadata | null }>({
    stepIndex: 1,
    metadata: null
  });

  const goToMetadata = React.useCallback(() => setState((s) => ({ ...s, stepIndex: 1 })), [setState]);
  const goToNominationFiles = React.useCallback(
    (metadata: AgendaMetadata) => {
      setState({ metadata, stepIndex: 2 });
    },
    [setState]
  );

  const cancel = React.useCallback(() => navigate(-1), [navigate]);

  const submit = React.useCallback(
    async (nominationFileIds: string[]) => {
      if (!state.metadata) {
        await waitForConfirmation({
          title: 'Métadonnées manquantes',
          content: 'Merci de renseigner les métadonnées avant de continuer',
          i18n: { confirm: "Retourner à l'étape 1", cancel: 'Rester sur cette étape' }
        });
        goToMetadata();
        return;
      }

      createAgenda.mutate(
        {
          sessionId,
          nominationFileIds,
          chairmanId: state.metadata.chairmanId,
          date: state.metadata.date,
          sessionMeetingDate: state.metadata.sessionMeetingDate
        },
        {
          onSuccess: () =>
            // TODO: replace with navigation to Agenda Preview
            navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId }))
        }
      );
    },
    [state, goToMetadata, createAgenda, sessionId, navigate, waitForConfirmation]
  );

  return (
    <NewAgendaContext
      value={{
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
      {props.children}
    </NewAgendaContext>
  );
}
