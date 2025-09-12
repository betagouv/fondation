import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FC } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Magistrat,
  updateTransparenceSchema,
  type EditTransparencyDto,
  type TransparenceSnapshot
} from 'shared-models';
import { DateOnly } from '../../../../../models/date-only.model';
import { formationToLabel } from '../../../../reports/labels/labels-mappers';

export type TableauDeBordEditTransparenceProps = {
  transparence: TransparenceSnapshot;
  onSubmit: (data: EditTransparencyDto) => void;
};

export const TableauDeBordEditTransparence: FC<TableauDeBordEditTransparenceProps> = ({
  transparence,
  onSubmit
}) => {
  const {
    name,
    formation,
    dateTransparence,
    dateClotureDelaiObservation,
    dateEcheance,
    datePriseDePosteCible
  } = transparence;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<EditTransparencyDto>({
    resolver: zodResolver(updateTransparenceSchema),
    defaultValues: {
      name,
      formation,
      dateTransparence: DateOnly.fromDateOnly(dateTransparence, 'yyyy-MM-dd'),
      dateClotureDelaiObservation: DateOnly.fromDateOnly(dateClotureDelaiObservation, 'yyyy-MM-dd'),
      dateEcheance: dateEcheance ? DateOnly.fromDateOnly(dateEcheance, 'yyyy-MM-dd') : undefined,
      datePriseDePosteCible: datePriseDePosteCible
        ? DateOnly.fromDateOnly(datePriseDePosteCible, 'yyyy-MM-dd')
        : undefined
    }
  });

  return (
    <form className="m-auto w-full max-w-[480px]" onSubmit={handleSubmit(onSubmit)}>
      <Controller<EditTransparencyDto, 'name'>
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
      <Controller<EditTransparencyDto, 'dateTransparence'>
        name="dateTransparence"
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
            state={errors.dateTransparence ? 'error' : 'default'}
            stateRelatedMessage={errors.dateTransparence?.message}
          />
        )}
      />
      <Controller<EditTransparencyDto, 'formation'>
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
      <Controller<EditTransparencyDto, 'dateClotureDelaiObservation'>
        name="dateClotureDelaiObservation"
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
            state={errors.dateClotureDelaiObservation ? 'error' : 'default'}
            stateRelatedMessage={errors.dateClotureDelaiObservation?.message}
          />
        )}
      />
      <Controller<EditTransparencyDto, 'dateEcheance'>
        name="dateEcheance"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label="Date d'échéance"
            id="date-echeance"
            nativeInputProps={{
              type: 'date',
              value,
              onChange,
              ...field
            }}
            state={errors.dateEcheance ? 'error' : 'default'}
            stateRelatedMessage={errors.dateEcheance?.message}
          />
        )}
      />
      <Controller<EditTransparencyDto, 'datePriseDePosteCible'>
        name="datePriseDePosteCible"
        control={control}
        render={({ field: { value, onChange, ...field } }) => (
          <Input
            className="w-full"
            label="Date de prise de poste"
            id="date-prise-de-poste"
            nativeInputProps={{
              type: 'date',
              value,
              onChange,
              ...field
            }}
            state={errors.datePriseDePosteCible ? 'error' : 'default'}
            stateRelatedMessage={errors.datePriseDePosteCible?.message}
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
