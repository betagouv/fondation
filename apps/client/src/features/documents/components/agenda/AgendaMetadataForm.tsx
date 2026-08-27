import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useMemo, type ReactNode } from 'react';
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
  formation: FormationEnum;
  defaultValues?: AgendaMetadataFormValues | null;
  isSubmitting?: boolean;
  submitLabel: ReactNode;
  submitIconId?: IconClassName;
  cancelLabel: ReactNode;
  onCancel(): void;
  onSubmit(metadata: AgendaMetadata): void;
  className?: string;
}) {
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

  return (
    <form
      className={clsx('mx-auto max-w-2xl', props.className)}
      onSubmit={handleSubmit((values) => props.onSubmit(values as AgendaMetadata))}
    >
      <Controller
        control={control}
        name="sessionMeetingDate"
        render={({ field }) => (
          <Input
            label={
              <RequiredLabel>
                <FormattedMessage defaultMessage="Date de la séance" />
              </RequiredLabel>
            }
            nativeInputProps={{ type: 'date', ...field }}
            state={errors.sessionMeetingDate ? 'error' : 'default'}
            stateRelatedMessage={errors.sessionMeetingDate?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <Input
            label={
              <RequiredLabel>
                <FormattedMessage defaultMessage="Date de l'ordre du jour" />
              </RequiredLabel>
            }
            nativeInputProps={{ type: 'date', ...field }}
            state={errors.date ? 'error' : 'default'}
            stateRelatedMessage={errors.date?.message}
          />
        )}
      />

      <ChairmanSelector
        // oxlint-disable-next-line typescript/no-explicit-any
        control={control as any}
        formation={props.formation}
        name="chairmanId"
      />

      <ButtonsGroup
        alignment="right"
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
        inlineLayoutWhen="md and up"
      />
    </form>
  );
}
