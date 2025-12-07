import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Magistrat } from 'shared-models';
import { DateOnly } from '../../../../../../models/date-only.model';
import type { DetailedNominationSession } from '../../../../../../react-query/mutations/sg/nomination-sessions';
import { formationToLabel } from '../../../../../reports/labels/labels-mappers';
import { z } from 'zod';

export type TableauDeBordEditTransparenceProps = {
  transparence: DetailedNominationSession;
  onCancel: () => unknown;
  onSubmit: (data: {
    name: string;
    formation: Magistrat.Formation;
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
  const { name, formation, date, observationsClosingDate, dueDate, positionStartDate } = transparence;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().nonempty(),
        formation: z.nativeEnum(Magistrat.Formation),
        date: z.string().date('Format de date invalide'),
        observationsClosingDate: z.string().date('Format de date invalide'),
        dueDate: z.string().date('Format de date invalide').nullable(),
        positionStartDate: z.string().date('Format de date invalide').nullable()
      })
    ),
    defaultValues: {
      name,
      formation,
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
      <Controller
        name="formation"
        control={control}
        render={({ field: { value, onChange } }) => (
          <Select
            className="w-full"
            label="Formation*"
            nativeSelectProps={{
              value,
              onChange
            }}
            state={errors.formation ? 'error' : 'default'}
            stateRelatedMessage={errors.formation?.message}
          >
            <option disabled></option>
            <option value={Magistrat.Formation.SIEGE}>{formationToLabel(Magistrat.Formation.SIEGE)}</option>
            <option value={Magistrat.Formation.PARQUET}>
              {formationToLabel(Magistrat.Formation.PARQUET)}
            </option>
          </Select>
        )}
      />
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
