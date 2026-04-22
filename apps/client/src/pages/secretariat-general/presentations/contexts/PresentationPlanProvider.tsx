import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useCreateJusticePresentationPlanMutation,
  useJusticePresentationPlanMetadataQuery,
  useUpdateJusticePresentationPlanMutation
} from '@queries/agenda.queries';
import React from 'react';
import { generatePath, useNavigate, useParams } from 'react-router';
import { PresentationPlanContext } from './presentation-plan.context';
import type { PresentationPlanContextType } from './presentation-plan.type';

export function PresentationPlanProvider(props: React.PropsWithChildren) {
  const { planId = null } = useParams<{ planId: string }>();

  const { data: metadata, isFetching: isFetchingMeta } = useJusticePresentationPlanMetadataQuery({
    presentationPlanId: planId
  });

  const { mutate: create, isPending: isCreating } = useCreateJusticePresentationPlanMutation();
  const { mutate: update, isPending: isUpdating } = useUpdateJusticePresentationPlanMutation();

  const navigate = useNavigate();
  const [state, setState] = React.useState<PresentationPlanContextType['state']>({
    step: 'METADATA',
    formation: null,
    agendas: {},
    chairmanId: null,
    secretaryId: null,
    date: null,
    justiceContactId: null,
    time: null
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
      time: s.time ?? metadata.time
    }));
  }, [metadata]);

  const isDisabled = React.useMemo(() => {
    return isFetchingMeta || isCreating || isUpdating;
  }, [isFetchingMeta, isCreating, isUpdating]);

  const goToMetadata = React.useCallback(() => {
    setState((s) => ({ ...s, step: 'METADATA' }));
  }, []);

  const initPlanCreation = React.useCallback(
    (options: { agendaIds: string[] }) => {
      setState((s) => ({
        ...s,
        agendas: Object.fromEntries(options.agendaIds.map((id) => [id, null]))
      }));
      navigate(generatePath(ROUTE_PATHS.SG.PRESENTATIONS_NEW));
    },
    [navigate, setState]
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
    [setState]
  );

  const createPlan = React.useCallback(
    (options: { agendas: Record<string, string | null> }) => {
      setState((s) => ({ ...s, agendas: options.agendas }));

      if (!state.chairmanId || !state.secretaryId || !state.justiceContactId || !state.date || !state.time) {
        throw new Error(`Invalid value`);
      }

      const payload = {
        date: state.date,
        time: state.time,
        chairmanId: state.chairmanId,
        secretaryId: state.secretaryId,
        justiceContactId: state.justiceContactId,
        agendas: Object.entries(options.agendas).map(([id, comment]) => ({
          id,
          comment: comment?.trim() || null
        }))
      };

      if (planId) {
        update({ ...payload, id: planId });
      } else {
        create(payload);
      }
    },
    [state, setState, planId, update, create]
  );

  return (
    <PresentationPlanContext
      value={{ planId, state, isDisabled, goToMetadata, initPlanCreation, setMetadata, createPlan }}
    >
      {props.children}
    </PresentationPlanContext>
  );
}
