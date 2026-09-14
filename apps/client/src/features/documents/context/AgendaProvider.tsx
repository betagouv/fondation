import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState, type PropsWithChildren } from 'react';
import { useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { useConfirmModal } from '@/shared/context/confirm-modal';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { agendaKeys, useCreateAgendaMutation } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import { AgendaContext } from './AgendaContext';
import type { AgendaMetadata, AgendaStep } from './AgendaContext.types';

export function AgendaProvider(props: PropsWithChildren) {
  const { formatMessage } = useIntl();
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { waitForConfirmation } = useConfirmModal();
  const queryClient = useQueryClient();

  const createAgenda = useCreateAgendaMutation();

  const { data: session, isLoading: isLoadingSession } = useDetailedNominationSessionQuery({
    sessionId,
  });

  const [state, setState] = useState<{
    error: string | null;
    metadata: AgendaMetadata | null;
    stepIndex: 1 | 2;
  }>({
    error: null,
    metadata: null,
    stepIndex: 1,
  });

  const steps = useMemo<Record<1 | 2, AgendaStep>>(
    () => ({
      1: {
        index: 1,
        title: formatMessage({ defaultMessage: "Définir les informations de l'ordre du jour" }),
      },
      2: { index: 2, title: formatMessage({ defaultMessage: 'Sélectionnez les propositions' }) },
    }),
    [formatMessage],
  );

  const goToMetadata = useCallback(() => setState((s) => ({ ...s, stepIndex: 1 })), []);
  const goToFiles = useCallback((metadata: AgendaMetadata) => {
    setState((s) => ({ ...s, metadata, stepIndex: 2 }));
  }, []);

  const cancel = useCallback(() => {
    navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId }));
  }, [navigate, sessionId]);

  const submit = useCallback(
    async (selectedFileIds: readonly string[]) => {
      const metadata = state.metadata;
      if (!metadata) {
        const { isConfirmed } = await waitForConfirmation({
          content: formatMessage({
            defaultMessage: "Merci de renseigner les données de l'ODJ avant de continuer",
          }),
          i18n: {
            cancel: formatMessage({ defaultMessage: 'Rester sur cette étape' }),
            confirm: formatMessage({ defaultMessage: "Retourner à l'étape 1" }),
          },
          title: formatMessage({ defaultMessage: 'Métadonnées manquantes' }),
        });
        if (isConfirmed) goToMetadata();
        return;
      }

      createAgenda.mutate(
        {
          chairmanId: metadata.chairmanId,
          date: metadata.date,
          nominationFileIds: [...selectedFileIds],
          sessionId,
          sessionMeetingDate: metadata.sessionMeetingDate,
        },
        {
          onSuccess: async (result) => {
            await queryClient.invalidateQueries({
              queryKey: agendaKeys.findAgendaNominationFiles({ sessionId }),
            });
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
      state.metadata,
      goToMetadata,
      queryClient,
      createAgenda,
      sessionId,
      formatMessage,
      navigate,
      waitForConfirmation,
    ],
  );

  return (
    <AgendaContext
      value={{
        error: state.error,
        isSubmitting: createAgenda.isPending,
        metadata: state.metadata,
        session: {
          dueDate: session?.dueDate ?? null,
          formation: session?.formation ?? 'SIEGE',
          id: sessionId,
          outcomes: session?.outcomes ?? [],
        },
        step: steps[state.stepIndex],
        cancel,
        goToFiles,
        goToMetadata,
        submit,
      }}
    >
      {isLoadingSession ? <span className="ri-loader-4-line animate-spin" /> : props.children}
    </AgendaContext>
  );
}
