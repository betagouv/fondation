import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { format } from 'date-fns';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';

import type { AgendaMetadata } from '@/features/agenda/context/AgendaContext.types';
import { ChairmanSelector } from '@/features/documents/components/ChairmanSelector';
import type { FormationEnum } from '@/types/enums.types';
import type { IconClassName } from '@/types/icons.types';
import { dateOnlyCodec, dateOnlyToDate, type PlainDateOnly } from '@/utils/date-only.util';

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
  formation: FormationEnum;
  defaultValues?: AgendaMetadataFormValues | null;
  isSubmitting?: boolean;
  submitLabel: React.ReactNode;
  submitIconId?: IconClassName;
  cancelLabel: React.ReactNode;
  onCancel(): void;
  onSubmit(metadata: AgendaMetadata): void;
  className?: string;
}) {
  const { defaultValues: metadata } = props;
  const defaultValues = React.useMemo(
    () => ({
      chairmanId: metadata?.chairmanId ?? '',
      date: format(dateOnlyToDate(metadata?.date) ?? new Date(), 'yyyy-MM-dd'),
      sessionMeetingDate: metadata?.sessionMeetingDate
        ? format(dateOnlyToDate(metadata.sessionMeetingDate), 'yyyy-MM-dd')
        : '',
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

  return (
    <form
      onSubmit={handleSubmit((values) => props.onSubmit(values as AgendaMetadata))}
      className={clsx('mx-auto max-w-2xl', props.className)}
    >
      <Controller
        name="sessionMeetingDate"
        control={control}
        render={({ field }) => (
          <Input
            label={
              <>
                Date de la séance<span className="text-(--text-default-error)">*</span>
              </>
            }
            nativeInputProps={{ type: 'date', ...field }}
            state={errors.sessionMeetingDate ? 'error' : 'default'}
            stateRelatedMessage={errors.sessionMeetingDate?.message}
          />
        )}
      />
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <Input
            label={
              <>
                Date de l'ordre du jour<span className="text-(--text-default-error)">*</span>
              </>
            }
            nativeInputProps={{ type: 'date', ...field }}
            state={errors.date ? 'error' : 'default'}
            stateRelatedMessage={errors.date?.message}
          />
        )}
      />

      <ChairmanSelector
        name="chairmanId"
        // oxlint-disable-next-line typescript/no-explicit-any
        control={control as any}
        formation={props.formation}
      />

      <ButtonsGroup
        alignment="right"
        inlineLayoutWhen="md and up"
        buttons={[
          { children: props.cancelLabel, priority: 'secondary', onClick: props.onCancel, type: 'button' },
          {
            type: 'submit',
            disabled: !isValid || props.isSubmitting,
            className: clsx({ 'before:animate-spin': props.isSubmitting }),
            iconId: props.isSubmitting ? 'ri-loader-4-line' : (props.submitIconId ?? 'ri-file-pdf-2-line'),
            children: props.submitLabel,
          },
        ]}
      />
    </form>
  );
}
