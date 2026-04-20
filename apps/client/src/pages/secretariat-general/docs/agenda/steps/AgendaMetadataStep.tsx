import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';

import { DateOnly } from '@/models/date-only.model';
import clsx from 'clsx';
import type { DateOnlyJson } from 'shared-models';
import { AgendaChairmanSelect } from '../components/AgendaChairmanSelect';
import { useAgenda } from '../context/AgendaContext';

const AgendaMetadataSchema = z.object({
  date: DateOnly.codec(),
  sessionMeetingDate: DateOnly.codec(),
  chairmanId: z.uuid('Veuillez sélectionner un président')
});

function dateOnlyString(json: DateOnlyJson): string {
  return DateOnly.fromStoreModel(json).toFormattedString('yyyy-MM-dd');
}

export function AgendaMetadataStep(props: { className?: string }) {
  const { metadata, goToNominationFiles, cancel } = useAgenda();
  const defaultValues = React.useMemo(
    () => ({
      chairmanId: metadata?.chairmanId ?? '',
      date: metadata?.date ? dateOnlyString(metadata.date) : new Date().toISOString().split('T')[0]!,
      sessionMeetingDate: metadata?.sessionMeetingDate ? dateOnlyString(metadata.sessionMeetingDate) : ''
    }),
    [metadata]
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    resolver: zodResolver(AgendaMetadataSchema),
    defaultValues: defaultValues
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
      <Controller
        name="chairmanId"
        control={control}
        render={({ field }) => <AgendaChairmanSelect {...field} error={errors.chairmanId?.message} />}
      />
      <ButtonsGroup
        alignment="right"
        inlineLayoutWhen="md and up"
        buttons={[
          { children: 'Annuler', priority: 'secondary', onClick: cancel, type: 'button' },
          { children: 'Sélectionner les propositions', type: 'submit', disabled: !isValid }
        ]}
      />
    </form>
  );
}
