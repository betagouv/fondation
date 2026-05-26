import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  presentationPlanKeys,
  useCreateJusticePresentationPlanMutation,
  useJusticePresentationPlanMetadataQuery,
  useResetPresentationPlanDocumentMutation,
  useUpdateJusticePresentationPlanMutation,
} from '@queries/agenda.queries';

import { PresentationPlanContext } from './presentation-plan.context';
import type { PresentationPlanContextType } from './presentation-plan.type';

export function PresentationPlanProvider(props: React.PropsWithChildren) {
  const { planId = null } = useParams<{ planId: string }>();

  const { data: metadata, isFetching: isFetchingMeta } = useJusticePresentationPlanMetadataQuery({
    presentationPlanId: planId,
  });

  const { mutate: create, isPending: isCreating } = useCreateJusticePresentationPlanMutation();
  const { mutate: update, isPending: isUpdating } = useUpdateJusticePresentationPlanMutation();
  const { mutate: resetPlan } = useResetPresentationPlanDocumentMutation(planId ?? '');

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatMessage } = useIntl();
  const { waitForConfirmation } = useConfirmation();
  const [state, setState] = React.useState<PresentationPlanContextType['state']>({
    step: 'METADATA',
    formation: null,
    agendas: {},
    chairmanId: null,
    secretaryId: null,
    date: null,
    justiceContactId: null,
    time: null,
  });

  React.useEffect(() => {
    if (!metadata) return;

    setState((s) => ({
      ...s,

      formation: s.formation ?? metadata.formation,
      secretaryId: s.secretaryId ?? metadata.secretaryId,
      agendas:
        Object.keys(s.agendas).length > 0
          ? s.agendas
          : Object.fromEntries(metadata.agendas.map(({ id, comment }) => [id, comment])),
      chairmanId: s.chairmanId ?? metadata.chairmanId,
      date: s.date ?? metadata.date,
      justiceContactId: s.justiceContactId ?? metadata.justiceDepartmentContactId,
      time: s.time ?? metadata.time,
    }));
  }, [metadata]);

  const isDisabled = React.useMemo(() => {
    return isFetchingMeta || isCreating || isUpdating;
  }, [isFetchingMeta, isCreating, isUpdating]);

  const goToMetadata = React.useCallback(() => {
    setState((s) => ({ ...s, step: 'METADATA' }));
  }, []);

  const initPlanCreation = React.useCallback(
    (options: { agendaIds: string[]; formation: 'PARQUET' | 'SIEGE' }) => {
      setState((s) => ({
        ...s,
        formation: options.formation,
        agendas: Object.fromEntries(options.agendaIds.map((id) => [id, null])),
      }));
      navigate(generatePath(ROUTE_PATHS.SG.PRESENTATIONS_NEW));
    },
    [navigate, setState],
  );

  const setMetadata = React.useCallback(
    (options: {
      chairmanId: string;
      secretaryId: string;
      justiceContactId: string;
      date: { day: number; month: number; year: number };
      time: { hours: number; minutes: number };
    }) => {
      setState((s) => ({ ...s, ...options, step: 'AGENDA_COMMENTS' }));
    },
    [setState],
  );

  const createPlan = React.useCallback(
    async (options: { agendas: Record<string, string | null> }) => {
      setState((s) => ({ ...s, agendas: options.agendas }));

      if (!state.chairmanId || !state.secretaryId || !state.justiceContactId || !state.date || !state.time) {
        throw new Error(`Invalid value`);
      }

      if (planId) {
        const { isConfirmed } = await waitForConfirmation({
          title: formatMessage({ defaultMessage: `Supprimer l'ancienne version` }),
          i18n: { confirm: formatMessage({ defaultMessage: `Oui, écraser le plan de présentation` }) },
          content: (
            <>
              <p>
                {metadata?.isManuallyEdited ? (
                  <FormattedMessage
                    values={{ bold: (x) => <strong>{x}</strong> }}
                    defaultMessage={
                      `En confirmant, vous allez écraser l'ancienne version de la notice de restitution,` +
                      `<bold>y compris ses éditions manuelles</bold>, sans pouvoir les récupérer`
                    }
                  />
                ) : (
                  <FormattedMessage
                    defaultMessage={
                      `En confirmant, vous allez écraser l'ancienne version de la notice de restitution` +
                      `sans pouvoir la récupérer`
                    }
                  />
                )}
              </p>
              <p>
                <FormattedMessage defaultMessage="Êtes-vous sûr de vouloir continuer&nbsp;?" />
              </p>
            </>
          ),
        });

        if (!isConfirmed) return;
      }

      const payload = {
        date: state.date,
        time: state.time,
        chairmanId: state.chairmanId,
        secretaryId: state.secretaryId,
        justiceContactId: state.justiceContactId,
        agendas: Object.entries(options.agendas).map(([id, comment]) => ({
          id,
          comment: comment?.trim() || null,
        })),
      };

      async function onSuccess(id: string) {
        await queryClient.invalidateQueries({ queryKey: presentationPlanKeys.planHtml({ id }) });
        navigate(generatePath(ROUTE_PATHS.SG.PRESENTATIONS_PREVIEW, { planId: id }));
      }

      if (planId) {
        resetPlan(undefined, {
          onSuccess: () => update({ ...payload, id: planId }, { onSuccess: () => onSuccess(planId) }),
        });
      } else {
        create(payload, {
          onSuccess: ({ data }) => {
            if (data) return onSuccess(data.id);
          },
        });
      }
    },
    [
      state,
      setState,
      planId,
      update,
      create,
      resetPlan,
      navigate,
      queryClient,
      waitForConfirmation,
      formatMessage,
      metadata?.isManuallyEdited,
    ],
  );

  return (
    <PresentationPlanContext
      value={{ planId, state, isDisabled, goToMetadata, initPlanCreation, setMetadata, createPlan }}
    >
      {planId ? state.formation && props.children : props.children}
    </PresentationPlanContext>
  );
}
