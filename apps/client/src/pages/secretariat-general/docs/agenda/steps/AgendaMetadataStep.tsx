import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { format } from 'date-fns';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';

import { ChairmanSelector } from '../../components/ChairmanSelector';
import { useAgenda } from '../context/AgendaContext';
import type { AgendaMetadata } from '../context/AgendaContext.types';
import { dateOnlyCodec, dateOnlyToDate } from '@/utils/date-only.util';

const AgendaMetadataSchema = z.object({
  date: dateOnlyCodec,
  sessionMeetingDate: dateOnlyCodec,
  chairmanId: z.uuid('Veuillez sélectionner un président'),
});

export function AgendaMetadataStep(props: { className?: string }) {
  const { metadata, submit, goToFiles, session, isSubmitting, agendaId } = useAgenda();
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
      onSubmit={handleSubmit((values) => submit(values as AgendaMetadata))}
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
        formation={session.formation}
      />

      <ButtonsGroup
        alignment="right"
        inlineLayoutWhen="md and up"
        buttons={[
          { children: 'Retour', priority: 'secondary', onClick: goToFiles, type: 'button' },
          {
            type: 'submit',
            disabled: !isValid || isSubmitting,
            className: clsx({ 'before:animate-spin': isSubmitting }),
            iconId: isSubmitting ? 'ri-loader-4-line' : 'ri-file-pdf-2-line',
            children: agendaId ? "Modifier l'ordre du jour" : "Générer l'ordre du jour",
          },
        ]}
      />
    </form>
  );
}
