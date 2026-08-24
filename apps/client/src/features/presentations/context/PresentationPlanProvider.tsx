import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { useConfirmModal } from '@/shared/context/confirm-modal';
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

const MANDATORY_METADATA = ['chairmanId', 'date', 'justiceContactId', 'secretaryId', 'time'] as const;

export function PresentationPlanProvider(props: PropsWithChildren) {
  const { planId = null } = useParams<{ planId: string }>();

  const { data: metadata, isFetching: isFetchingMeta } = useJusticePresentationPlanMetadataQuery({
    presentationPlanId: planId,
  });

  const {
    mutate: create,
    error: creationError,
    isPending: isCreating,
    reset: resetCreation,
  } = useCreateJusticePresentationPlanMutation();
  const {
    mutate: update,
    error: updateError,
    isPending: isUpdating,
    reset: resetUpdate,
  } = useUpdateJusticePresentationPlanMutation();
  const { mutate: resetPlan, reset: resetReset } = useResetPresentationPlanDocumentMutation(planId ?? '');

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatMessage } = useIntl();
  const { waitForConfirmation } = useConfirmModal();
  const [state, setState] = useState<PresentationPlanContextType['state']>({
    step: 'METADATA',
    formation: null,
    agendas: {},
    chairmanId: null,
    secretaryId: null,
    date: null,
    justiceContactId: null,
    time: null,
    absentMemberIds: [],
    hasRenunciation: true,
  });

  useEffect(() => {
    if (!metadata) return;

    setState((s) => ({
      ...s,

      absentMemberIds: s.absentMemberIds.length != 0 ? [...s.absentMemberIds] : [...metadata.absentMemberIds],
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
      hasRenunciation: !metadata.hasRenunciation ? metadata.hasRenunciation : s.hasRenunciation,
    }));
  }, [metadata]);

  const isDisabled = useMemo(() => {
    return isFetchingMeta || isCreating || isUpdating;
  }, [isFetchingMeta, isCreating, isUpdating]);

  const goToMetadata = useCallback(() => {
    setState((s) => ({ ...s, step: 'METADATA' }));
  }, []);

  const initPlanCreation = useCallback(
    (options: { agendaIds: string[]; formation: 'PARQUET' | 'SIEGE' }) => {
      setState((s) => ({
        ...s,
        step: 'METADATA',
        formation: options.formation,
        agendas: Object.fromEntries(options.agendaIds.map((id) => [id, null])),
        absentMemberIds: [],
        chairmanId: null,
        date: null,
        hasRenunciation: true,
        justiceContactId: null,
        secretaryId: null,
        time: null,
      }));
      navigate(generatePath(ROUTE_PATHS.SG.PRESENTATIONS_NEW));
    },
    [navigate, setState],
  );

  const setMetadata = useCallback(
    (options: {
      chairmanId: string;
      secretaryId: string;
      justiceContactId: string;
      date: { day: number; month: number; year: number };
      time: { hours: number; minutes: number };
      absentMemberIds: readonly string[];
    }) => {
      setState((s) => ({
        ...s,
        ...options,
        step: 'AGENDA_COMMENTS',
        absentMemberIds: [...options.absentMemberIds],
      }));
    },
    [setState],
  );

  const missingMetadata = MANDATORY_METADATA.filter((key) => !state[key]);
  const hasAllMandatoryMetadata = missingMetadata.length === 0;

  const createPlan = useCallback(
    async (options: { agendas: Record<string, string | null> }) => {
      setState((s) => ({ ...s, agendas: options.agendas }));

      if (!state.chairmanId || !state.secretaryId || !state.justiceContactId || !state.date || !state.time) {
        throw new Error(`Cannot create a presentation plan, missing ${missingMetadata.join(', ')}`);
      }

      if (planId) {
        const { isConfirmed } = await waitForConfirmation({
          title: formatMessage({ defaultMessage: `Supprimer l'ancienne version` }),
          i18n: { confirm: formatMessage({ defaultMessage: `Oui, écraser la notice` }) },
          content: (
            <>
              <p>
                {metadata?.isManuallyEdited ? (
                  <FormattedMessage
                    defaultMessage={
                      `En confirmant, vous allez écraser l'ancienne version de la notice de restitution,` +
                      `<bold>y compris ses éditions manuelles</bold>, sans pouvoir les récupérer`
                    }
                    values={{ bold: (x) => <strong>{x}</strong> }}
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
                <FormattedMessage defaultMessage={'Êtes-vous sûr de vouloir continuer\u00A0?'} />
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
        absentMembers: [...state.absentMemberIds],
        hasRenunciation: state.hasRenunciation,
      };

      function onSuccess(id: string) {
        queryClient.invalidateQueries({ queryKey: presentationPlanKeys.planHtml({ id }) });
        resetCreation();
        resetUpdate();
        resetReset();
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
      missingMetadata,
      resetPlan,
      navigate,
      queryClient,
      waitForConfirmation,
      formatMessage,
      metadata?.isManuallyEdited,
      resetCreation,
      resetUpdate,
      resetReset,
    ],
  );

  return (
    <PresentationPlanContext
      value={{
        planId,
        state,
        isFetching: isFetchingMeta,
        isDisabled,
        hasAllMandatoryMetadata,
        hasFailed: Boolean(creationError || updateError),
        goToMetadata,
        initPlanCreation,
        setMetadata,
        createPlan,
      }}
    >
      {planId ? state.formation && props.children : props.children}
    </PresentationPlanContext>
  );
}
