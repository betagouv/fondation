import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { add } from 'date-fns';
import { useCallback, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { Modal } from '@/shared/ui/modal';
import { useToasts } from '@/shared/ui/toast';
import {
  dateToTimeOnly,
  formTimeOnlyCodec,
  timeOnlyToDate,
  timeOnlyToString,
  type PlainTimeOnly,
} from '@/utils/time-only.util';
import { usePresentPlansMutation, type PresentedPlansResult } from '@queries/agenda.queries';

import { PresentPlanModalContext, type PresentedPlan } from './present-plan-modal.context';

const FORM_ID = 'present-plan-form';

function PresentPlanModal(props: {
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
  plans: readonly PresentedPlan[];
}) {
  const { $t, formatList } = useIntl();
  const toasts = useToasts();
  const describeFailure = useDocumentFailure();
  const presentPlansMutation = usePresentPlansMutation();

  const latestStartTime = useMemo(
    () =>
      props.plans
        .map(({ startTime }) => timeOnlyToDate(startTime))
        .filter((startTime): startTime is Date => startTime !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
    [props.plans],
  );

  const defaultEndTime = useMemo(() => {
    if (!latestStartTime) return '';

    const timeOnly = dateToTimeOnly(add(latestStartTime, { minutes: 10 }));
    return timeOnly ? (timeOnlyToString(timeOnly, 'HH:mm') ?? '') : '';
  }, [latestStartTime]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'all',
    defaultValues: { endTime: defaultEndTime },
    resolver: zodResolver(
      z.object({
        endTime: formTimeOnlyCodec.refine(
          (endTimeOnly) => {
            if (!latestStartTime) return true;

            const endTime = timeOnlyToDate(endTimeOnly);
            return endTime ? endTime.getTime() >= latestStartTime.getTime() : false;
          },
          { error: `L'heure de début de la séance doit être avant son heure de fin` },
        ),
      }),
    ),
  });

  const reportFailure = useCallback(
    ({ failure, presentedIds }: PresentedPlansResult) => {
      if (!failure) return;

      const nameOf = (planId: string) => props.plans.find((plan) => plan.planId === planId)?.name ?? planId;
      const presentedNames = presentedIds.map(nameOf);

      toasts.error({
        description: [
          presentedNames.length > 0
            ? $t(
                {
                  defaultMessage:
                    '{count, plural, one {{names} est restituée.} other {{names} sont restituées.}}',
                },
                { count: presentedNames.length, names: formatList(presentedNames) },
              )
            : null,
          describeFailure(failure.error),
        ]
          .filter(Boolean)
          .join(' '),
        title: $t(
          { defaultMessage: `La restitution s'est arrêtée à {name}` },
          { name: nameOf(failure.planId) },
        ),
      });
    },
    [$t, describeFailure, formatList, props.plans, toasts],
  );

  const onSubmit = useCallback(
    async ({ endTime: { hours, minutes } }: { endTime: PlainTimeOnly }) => {
      const result = await presentPlansMutation.mutateAsync({
        endTime: { hours, minutes },
        planIds: props.plans.map(({ planId }) => planId),
      });

      reportFailure(result);
      props.onClose();
    },
    [presentPlansMutation, props, reportFailure],
  );

  return (
    <Modal
      actions={
        <>
          <Button disabled={presentPlansMutation.isPending} onClick={props.onClose} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>

          <Button
            disabled={presentPlansMutation.isPending}
            nativeButtonProps={{ form: FORM_ID, type: 'submit' }}
          >
            <FormattedMessage defaultMessage="Confirmer" />
          </Button>
        </>
      }
      closeOnBackdrop={false}
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      title={<FormattedMessage defaultMessage="Confirmer la restitution" />}
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)}>
        <p>
          <FormattedMessage
            defaultMessage="{count, plural, one {Vous allez marquer cette notice comme restituée.} other {Vous allez marquer ces {count} notices comme restituées.}}"
            values={{ count: props.plans.length }}
          />
        </p>

        <Controller
          control={control}
          name="endTime"
          render={({ field }) => (
            <Input
              label={$t({ defaultMessage: 'Heure de fin de la session' })}
              nativeInputProps={{ ...field, type: 'time' }}
              state={errors.endTime ? 'error' : undefined}
              stateRelatedMessage={errors.endTime?.message}
            />
          )}
        />
      </form>
    </Modal>
  );
}

type PresentPlanSession = { id: number; plans: readonly PresentedPlan[] };

type PresentPlanState =
  | { session: PresentPlanSession; status: 'closing' }
  | { session: PresentPlanSession; status: 'presenting' }
  | { status: 'idle' };

export function PresentPlanModalProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<PresentPlanState>({ status: 'idle' });
  const lastSessionId = useRef(0);

  const presentPlans = useCallback((plans: readonly PresentedPlan[]) => {
    lastSessionId.current += 1;
    setState({ session: { id: lastSessionId.current, plans }, status: 'presenting' });
  }, []);

  const close = useCallback(
    () =>
      setState((current) =>
        current.status === 'presenting' ? { session: current.session, status: 'closing' } : current,
      ),
    [],
  );

  const value = useMemo(() => ({ presentPlans }), [presentPlans]);

  return (
    <PresentPlanModalContext value={value}>
      {state.status !== 'idle' && (
        <PresentPlanModal
          key={state.session.id}
          onClose={close}
          onClosed={() =>
            setState((current) => (current.status === 'closing' ? { status: 'idle' } : current))
          }
          open={state.status === 'presenting'}
          plans={state.session.plans}
        />
      )}

      {children}
    </PresentPlanModalContext>
  );
}
