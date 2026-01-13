import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import type { DetailedNominationSessionDto } from '@api/types';

import { DateOnly } from '../../../../../../models/date-only.model';
import { formationToLabel } from '../../../../../reports/labels/labels-mappers';

export type TableauDeBordEditTransparenceProps = {
  transparence: DetailedNominationSessionDto;
  onCancel: () => unknown;
  onSubmit: (data: {
    name: string;
    date: string;
    observationsClosingDate: string;
    dueDate: string | null;
    positionStartDate: string | null;
  }) => Promise<void>;
};

export const TableauDeBordEditTransparence: FC<TableauDeBordEditTransparenceProps> = ({
  transparence,
  onSubmit,
  onCancel
}) => {
  const { name, date, observationsClosingDate, dueDate, positionStartDate } = transparence;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().nonempty(),
        date: z.iso.date('Format de date invalide'),
        observationsClosingDate: z.iso.date('Format de date invalide'),
        dueDate: z.iso.date('Format de date invalide').nullable(),
        positionStartDate: z.iso.date('Format de date invalide').nullable()
      })
    ),
    defaultValues: {
      name,
      date: DateOnly.fromDateOnly(date, 'yyyy-MM-dd'),
      observationsClosingDate: DateOnly.fromDateOnly(observationsClosingDate, 'yyyy-MM-dd'),
      dueDate: dueDate ? DateOnly.fromDateOnly(dueDate, 'yyyy-MM-dd') : null,
      positionStartDate: positionStartDate ? DateOnly.fromDateOnly(positionStartDate, 'yyyy-MM-dd') : null
    }
  });

  return (
    <form className="m-auto w-full max-w-[480px]" onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="name"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label="Nom de la transparence*"
            id="nom-transparence"
            nativeInputProps={{
              value,
              onChange,
              ...field,
              placeholder: 'Nom de la transparence'
            }}
            state={errors.name ? 'error' : 'default'}
            stateRelatedMessage={errors.name?.message}
          />
        )}
      />
      <Controller
        name="date"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label="Date de la transparence*"
            id="date-transparence"
            nativeInputProps={{
              type: 'date',
              value,
              onChange,
              ...field
            }}
            state={errors.date ? 'error' : 'default'}
            stateRelatedMessage={errors.date?.message}
          />
        )}
      />

      <div className="mb-6">
        <div className="fr-label" id="edit-formation-label">
          Formation:
        </div>
        <div
          aria-labelledby="edit-formation-label"
          id="edit-formation"
          className="mt-2 cursor-default rounded-t border-0 border-b-2 border-solid border-[color:var(--border-plain-grey)] bg-[var(--background-contrast-grey)] px-4 py-2"
        >
          {formationToLabel(transparence.formation).toUpperCase()}
        </div>
      </div>

      <Controller
        name="observationsClosingDate"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label="Clôture du délai d'observation*"
            id="date-cloture-delai-observation"
            nativeInputProps={{
              type: 'date',
              value,
              onChange,
              ...field
            }}
            state={errors.observationsClosingDate ? 'error' : 'default'}
            stateRelatedMessage={errors.observationsClosingDate?.message}
          />
        )}
      />
      <Controller
        name="dueDate"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label="Date d'échéance"
            id="date-echeance"
            nativeInputProps={{
              type: 'date',
              value: value ?? undefined,
              onChange,
              ...field
            }}
            state={errors.dueDate ? 'error' : 'default'}
            stateRelatedMessage={errors.dueDate?.message}
          />
        )}
      />
      <Controller
        name="positionStartDate"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label="Date de prise de poste"
            id="date-prise-de-poste"
            nativeInputProps={{
              type: 'date',
              value: value ?? undefined,
              onChange,
              ...field
            }}
            state={errors.positionStartDate ? 'error' : 'default'}
            stateRelatedMessage={errors.positionStartDate?.message}
          />
        )}
      />
      <ButtonsGroup
        buttons={[
          {
            id: 'annuler',
            children: 'Annuler',
            priority: 'tertiary',
            type: 'reset',
            onClick: () => {
              reset();
              onCancel();
            }
          },
          {
            id: 'enregistrer',
            children: 'Enregistrer',
            type: 'submit'
          }
        ]}
        inlineLayoutWhen="always"
      />
    </form>
  );
};
