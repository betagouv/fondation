import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useId, useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import z from 'zod';

import { ChairmanSelector } from '@/features/documents/components/ChairmanSelector';
import type { AgendaMetadata } from '@/features/documents/context/AgendaContext.types';
import { RequiredLabel } from '@/shared/ui/required-label';
import type { FormationEnum } from '@/types/enums.types';
import type { IconClassName } from '@/types/icons.types';
import { dateOnlyCodec, dateOnlyToIso, type PlainDateOnly } from '@/utils/date-only.util';

type AgendaMetadataFormValues = {
  chairmanId?: string | null;
  date?: PlainDateOnly | null;
  sessionMeetingDate?: PlainDateOnly | null;
};

const AgendaMetadataSchema = z.object({
  date: dateOnlyCodec,
  sessionMeetingDate: dateOnlyCodec,
  chairmanId: z.uuid('Veuillez sélectionner un président'),
});

export function AgendaMetadataForm(props: {
  actionsSlot?: Element | null;
  cancelLabel?: ReactNode;
  className?: string;
  defaultValues?: AgendaMetadataFormValues | null;
  formation: FormationEnum;
  isSubmitting?: boolean;
  onCancel?(): void;
  onSubmit(metadata: AgendaMetadata): void;
  submitIconId?: IconClassName;
  submitLabel: ReactNode;
}) {
  const formId = useId();
  const { defaultValues: metadata } = props;
  const defaultValues = useMemo(
    () => ({
      chairmanId: metadata?.chairmanId ?? '',
      date: dateOnlyToIso(metadata?.date) ?? format(new Date(), 'yyyy-MM-dd'),
      sessionMeetingDate: metadata?.sessionMeetingDate ? dateOnlyToIso(metadata.sessionMeetingDate) : '',
    }),
    [metadata],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: 'all',
    resolver: zodResolver(AgendaMetadataSchema),
    defaultValues: defaultValues,
  });

  const submitIconId = props.isSubmitting ? 'ri-loader-4-line' : props.submitIconId;

  const submitButton = {
    children: props.submitLabel,
    className: clsx({ 'before:animate-spin': props.isSubmitting }),
    disabled: !isValid || props.isSubmitting,
    iconId: submitIconId as undefined,
    type: 'submit' as const,
  };

  const cancelButton = (onCancel: () => void) => ({
    children: props.cancelLabel,
    onClick: onCancel,
    priority: 'secondary' as const,
    type: 'button' as const,
  });

  return (
    <>
      {props.actionsSlot &&
        createPortal(
          <ButtonsGroup
            alignment="right"
            buttons={[{ ...submitButton, nativeButtonProps: { form: formId } }]}
            inlineLayoutWhen="always"
          />,
          props.actionsSlot,
        )}

      <form
        className={clsx('mx-auto max-w-2xl', props.className)}
        id={formId}
        onSubmit={handleSubmit((values) => props.onSubmit(values as AgendaMetadata))}
      >
        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <Input
              label={
                <RequiredLabel>
                  <FormattedMessage defaultMessage="Date de création de l'ordre du jour" />
                </RequiredLabel>
              }
              nativeInputProps={{ type: 'date', ...field }}
              state={errors.date ? 'error' : 'default'}
              stateRelatedMessage={errors.date?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="sessionMeetingDate"
          render={({ field }) => (
            <Input
              label={
                <RequiredLabel>
                  <FormattedMessage defaultMessage="Date de la séance de restitution" />
                </RequiredLabel>
              }
              nativeInputProps={{ type: 'date', ...field }}
              state={errors.sessionMeetingDate ? 'error' : 'default'}
              stateRelatedMessage={errors.sessionMeetingDate?.message}
            />
          )}
        />

        <ChairmanSelector
          // oxlint-disable-next-line typescript/no-explicit-any
          control={control as any}
          formation={props.formation}
          name="chairmanId"
        />

        {!props.actionsSlot && (
          <ButtonsGroup
            alignment="right"
            buttons={props.onCancel ? [cancelButton(props.onCancel), submitButton] : [submitButton]}
            inlineLayoutWhen="md and up"
          />
        )}
      </form>
    </>
  );
}
