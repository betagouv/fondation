import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import { add } from 'date-fns';
import { useCallback, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';

import { Modal } from '@/shared/ui/modal';
import {
  dateToTimeOnly,
  formTimeOnlyCodec,
  timeOnlyToDate,
  timeOnlyToString,
  type PlainTimeOnly,
} from '@/utils/time-only.util';
import { usePresentPlanMutation } from '@queries/agenda.queries';

import { PresentPlanModalContext, type PresentedPlan } from './present-plan-modal.context';

const FORM_ID = 'present-plan-form';

function PresentPlanModal(props: {
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
  plan: PresentedPlan;
}) {
  const { $t } = useIntl();
  const presentPlanMutation = usePresentPlanMutation();

  const defaultEndTime = useMemo(() => {
    const startTime = timeOnlyToDate(props.plan.startTime);
    if (!startTime) return '';

    const timeOnly = dateToTimeOnly(add(startTime, { minutes: 10 }));
    return timeOnly ? (timeOnlyToString(timeOnly, 'HH:mm') ?? '') : '';
  }, [props.plan.startTime]);

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
            const startTime = timeOnlyToDate(props.plan.startTime);
            if (!startTime) return true;

            const endTime = timeOnlyToDate(endTimeOnly);
            return endTime ? endTime.getTime() >= startTime.getTime() : false;
          },
          { error: `L'heure de début de la séance doit être avant son heure de fin` },
        ),
      }),
    ),
  });

  const onSubmit = useCallback(
    ({ endTime: { hours, minutes } }: { endTime: PlainTimeOnly }) =>
      presentPlanMutation.mutate(
        { endTime: { hours, minutes }, presentationPlanId: props.plan.planId },
        { onSuccess: props.onClose },
      ),
    [presentPlanMutation, props],
  );

  return (
    <Modal
      actions={
        <>
          <Button disabled={presentPlanMutation.isPending} onClick={props.onClose} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>

          <Button
            disabled={presentPlanMutation.isPending}
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
          <FormattedMessage defaultMessage="Vous allez marquer cette notice comme restituée." />
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

type PresentPlanSession = { id: number; plan: PresentedPlan };

type PresentPlanState =
  | { session: PresentPlanSession; status: 'closing' }
  | { session: PresentPlanSession; status: 'presenting' }
  | { status: 'idle' };

export function PresentPlanModalProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<PresentPlanState>({ status: 'idle' });
  const lastSessionId = useRef(0);

  const presentPlan = useCallback((plan: PresentedPlan) => {
    lastSessionId.current += 1;
    setState({ session: { id: lastSessionId.current, plan }, status: 'presenting' });
  }, []);

  const close = useCallback(
    () =>
      setState((current) =>
        current.status === 'presenting' ? { session: current.session, status: 'closing' } : current,
      ),
    [],
  );

  const value = useMemo(() => ({ presentPlan }), [presentPlan]);

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
          plan={state.session.plan}
        />
      )}

      {children}
    </PresentPlanModalContext>
  );
}
