import {
  dateToTimeOnly,
  formTimeOnlyCodec,
  timeOnlyToDate,
  timeOnlyToString,
  type TimeOnly,
} from '@/utils/time-only.util';
import Input from '@codegouvfr/react-dsfr/Input';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePresentPlanMutation } from '@queries/agenda.queries';
import clsx from 'clsx';
import { add } from 'date-fns';
import React, { type PropsWithChildren } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import z from 'zod';
import { PresentPlanModalContext } from './present-plan-modal.context';

const presentPlanModal = createModal({ isOpenedByDefault: false, id: 'present_plan_modal' });

function PresentPlanForm(props: {
  planId: string | null;
  startTime: { hours: number; minutes: number } | null;
}) {
  const { $t } = useIntl();
  const presentPlanMutation = usePresentPlanMutation();

  const defaultEndTime = React.useMemo(() => {
    if (!props.startTime) return '';

    const startTime = timeOnlyToDate(props.startTime);
    if (!startTime) return '';

    const in10Minutes = add(startTime, { minutes: 10 });
    const timeOnly = dateToTimeOnly(in10Minutes);
    if (!timeOnly) return '';

    return timeOnlyToString(timeOnly, 'HH:mm') ?? '';
  }, [props.startTime]);

  const {
    reset,
    control,
    handleSubmit,
    getValues,

    formState: { errors, isDirty },
  } = useForm({
    mode: 'all',
    defaultValues: { endTime: defaultEndTime },
    resolver: zodResolver(
      z.object({
        endTime: formTimeOnlyCodec.refine(
          (endTimeOnly) => {
            const startTime = props.startTime ? timeOnlyToDate(props.startTime) : null;
            if (!startTime) return true;

            const endTime = timeOnlyToDate(endTimeOnly);
            if (!endTime) return false;

            return endTime.getTime() >= startTime.getTime();
          },
          { error: `L'heure de début de la séance doit être avant son heure de fin` },
        ),
      }),
    ),
  });

  React.useEffect(() => {
    if (isDirty) return;

    const currentEndTime = getValues('endTime');
    if (currentEndTime !== defaultEndTime) {
      reset({ endTime: defaultEndTime });
    }
  }, [defaultEndTime, isDirty, reset, getValues]);

  useIsModalOpen(presentPlanModal, { onConceal: () => reset({ endTime: '' }) });

  const onSubmit = React.useCallback(
    ({ endTime: { hours = 0, minutes = 0 } }: { endTime: TimeOnly }) => {
      if (!props.planId) return;

      presentPlanMutation.mutate(
        {
          presentationPlanId: props.planId,
          endTime: { hours, minutes },
        },
        { onSuccess: () => presentPlanModal.close() },
      );
    },
    [props.planId, presentPlanMutation],
  );

  const prevent = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault(), []);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <presentPlanModal.Component
        concealingBackdrop={false}
        title={$t({ defaultMessage: 'Confirmer la restitution' })}
        buttons={[
          {
            doClosesModal: true,
            priority: 'secondary',
            disabled: presentPlanMutation.isPending,
            children: $t({ defaultMessage: 'Annuler' }),
            onClick: prevent,
          },
          {
            priority: 'primary',
            doClosesModal: false,
            disabled: presentPlanMutation.isPending,
            nativeButtonProps: { type: 'submit' },
            children: $t({ defaultMessage: 'Confirmer' }),
          },
        ]}
      >
        <div
          className={clsx('transition-opacity duration-100', {
            'opacity-100': !!props.planId,
            'opacity-0': !props.planId,
          })}
        >
          <p>
            <FormattedMessage defaultMessage="Vous allez marquer cette notice comme restituée." />
          </p>

          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <Input
                nativeInputProps={{ ...field, type: 'time' }}
                state={errors.endTime ? 'error' : undefined}
                stateRelatedMessage={errors.endTime?.message}
                label={$t({ defaultMessage: 'Heure de fin de la session' })}
              />
            )}
          />
        </div>
      </presentPlanModal.Component>
    </form>
  );
}

export function PresentPlanModalProvider({ children }: PropsWithChildren) {
  const [state, setState] = React.useState<{
    planId: string | null;
    startTime: { hours: number; minutes: number } | null;
  }>({ planId: null, startTime: null });

  const presentPlan = React.useCallback(
    (meta: { planId: string; startTime: { hours: number; minutes: number } }) => {
      setState({ ...meta });
      presentPlanModal.open();
    },
    [],
  );

  return (
    <PresentPlanModalContext value={{ presentPlan, buttonProps: presentPlanModal.buttonProps }}>
      <PresentPlanForm planId={state.planId} startTime={state.startTime} />

      {children}
    </PresentPlanModalContext>
  );
}
