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
import { dateOnlyCodec, dateOnlyToDate } from '@/utils/date-only.util';

const AgendaMetadataSchema = z.object({
  date: dateOnlyCodec,
  sessionMeetingDate: dateOnlyCodec,
  chairmanId: z.uuid('Veuillez sélectionner un président'),
});

export function AgendaMetadataStep(props: { className?: string }) {
  const { metadata, goToNominationFiles, cancel, session } = useAgenda();
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
    <form onSubmit={handleSubmit(goToNominationFiles)} className={clsx('mx-auto max-w-2xl', props.className)}>
      <Controller
        name="sessionMeetingDate"
        control={control}
        render={({ field }) => (
          <Input
            label={
              <>
                Date de la séance<span className="text-red-600">*</span>
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
                Date de l'ordre du jour<span className="text-red-600">*</span>
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
          { children: 'Annuler', priority: 'secondary', onClick: cancel, type: 'button' },
          { children: 'Sélectionner les propositions', type: 'submit', disabled: !isValid },
        ]}
      />
    </form>
  );
}
