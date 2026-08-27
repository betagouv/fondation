import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState, type PropsWithChildren } from 'react';
import { useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { useAgendaBasket } from '@/features/documents/hooks/useAgendaBasket.hook';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { agendaKeys, useCreateAgendaMutation } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import { AgendaContext } from './AgendaContext';
import type { AgendaMetadata, AgendaStep } from './AgendaContext.types';

const STEPS = {
  1: { index: 1, title: 'Sélection des propositions', nextTitle: 'Métadonnées' },
  2: { index: 2, title: 'Métadonnées' },
} as const satisfies Record<1 | 2, AgendaStep>;

export function AgendaProvider(props: PropsWithChildren) {
  const { formatMessage } = useIntl();
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { waitForConfirmation } = useConfirmModal();
  const queryClient = useQueryClient();
  const basket = useAgendaBasket(sessionId);

  const createAgenda = useCreateAgendaMutation();

  const { data: session, isLoading: isLoadingSession } = useDetailedNominationSessionQuery({
    sessionId,
  });

  const [state, setState] = useState<{
    stepIndex: 1 | 2;
    error: string | null;
    selectedFileIds: string[] | null;
  }>({
    error: null,
    stepIndex: 1,
    selectedFileIds: null,
  });

  const goToFiles = useCallback(() => setState((s) => ({ ...s, stepIndex: 1 })), []);
  const goToMetadata = useCallback((selectedFileIds: readonly string[]) => {
    setState((s) => ({ ...s, selectedFileIds: [...selectedFileIds], stepIndex: 2 }));
  }, []);

  const cancel = useCallback(() => {
    navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId }));
  }, [navigate, sessionId]);

  const submit = useCallback(
    async (metadata: AgendaMetadata) => {
      const nominationFileIds = state.selectedFileIds;
      if (!nominationFileIds || nominationFileIds.length === 0) {
        const { isConfirmed } = await waitForConfirmation({
          content: formatMessage({
            defaultMessage: 'Merci de sélectionner au moins une proposition avant de continuer',
          }),
          i18n: {
            cancel: formatMessage({ defaultMessage: 'Rester sur cette étape' }),
            confirm: formatMessage({ defaultMessage: "Retourner à l'étape 1" }),
          },
          title: formatMessage({ defaultMessage: 'Sélection manquante' }),
        });
        if (isConfirmed) goToFiles();
        return;
      }

      createAgenda.mutate(
        {
          sessionId,
          nominationFileIds,
          chairmanId: metadata.chairmanId,
          date: metadata.date,
          sessionMeetingDate: metadata.sessionMeetingDate,
        },
        {
          onSuccess: async (result) => {
            await queryClient.invalidateQueries({
              queryKey: agendaKeys.findAgendaNominationFiles({ sessionId }),
            });
            basket.clear();
            if (result?.id) {
              await queryClient.invalidateQueries({ queryKey: agendaKeys.agendaHtml(result.id) });
              return navigate(
                generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { sessionId, agendaId: result.id }),
              );
            }
          },
          onError: async (error) => {
            const defaultError = formatMessage({ defaultMessage: `Impossible de créer l'ordre du jour` });
            if (error instanceof HttpException) {
              const body = await error.response.json().catch(() => null);
              setState((s) => ({ ...s, error: body?.validationError || defaultError }));
            } else {
              setState((s) => ({ ...s, error: defaultError }));
            }
          },
        },
      );
    },
    [
      state.selectedFileIds,
      goToFiles,
      queryClient,
      createAgenda,
      sessionId,
      formatMessage,
      navigate,
      waitForConfirmation,
      basket,
    ],
  );

  return (
    <AgendaContext
      value={{
        error: state.error,
        step: STEPS[state.stepIndex],
        session: {
          id: sessionId,
          dueDate: session?.dueDate ?? null,
          formation: session?.formation ?? 'SIEGE',
        },
        selectedFileIds: state.selectedFileIds,
        isSubmitting: createAgenda.isPending,
        goToFiles,
        goToMetadata,
        submit,
        cancel,
      }}
    >
      {isLoadingSession ? <span className="ri-loader-4-line animate-spin" /> : props.children}
    </AgendaContext>
  );
}
