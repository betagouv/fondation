import { ButtonsGroup } from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FC } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { Magistrat } from 'shared-models';
import { z } from 'zod';

import { useNavigate } from 'react-router-dom';
import { useAddTransparency } from '../../../../mutations/sg/add-transparency.mutation';
import { ROUTE_PATHS } from '../../../../utils/route-path.utils';
import { getSgBreadCrumb } from '../../../../utils/sg-breadcrumb.utils';
import { formationToLabel } from '../../../reports/labels/labels-mappers';
import { Breadcrumb } from '../../../shared/Breadcrumb';
import { PageContentLayout } from '../../../shared/PageContentLayout';

const mandatoryField = 'Champ obligatoire.';
const invalidDateFormat = 'Format de date invalide.';
const optionalDate = z.string().date(invalidDateFormat).optional();

const nouvelleTransparenceDtoSchema = z.object({
  nomTransparence: z
    .string({
      message: mandatoryField
    })
    .trim()
    .min(1, mandatoryField),
  dateTransparence: z.string({ message: mandatoryField }).date(invalidDateFormat),
  formation: z.nativeEnum(Magistrat.Formation, {
    message: mandatoryField
  }),
  dateEcheance: optionalDate,
  datePriseDePosteCible: optionalDate,
  dateClôtureDélaiObservation: z.string({ message: mandatoryField }).date(invalidDateFormat),
  fichier: z
    .instanceof(File, { message: mandatoryField })
    .refine((file) => file.size > 0, {
      message: mandatoryField
    })
    .refine(
      (file) => {
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        return validTypes.includes(file.type);
      },
      { message: 'Veuillez importer un fichier au bon format.' }
    )
});

type FormSchema = z.infer<typeof nouvelleTransparenceDtoSchema>;

const NouvelleTransparence: FC = () => {
  const navigate = useNavigate();
  const { mutateAsync: addTransparencyAsync, data: lastRecordedTransparence } = useAddTransparency();
  const breadcrumb = getSgBreadCrumb(ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE, navigate);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormSchema>({
    resolver: zodResolver(nouvelleTransparenceDtoSchema)
  });

  const onSubmit: SubmitHandler<FormSchema> = async (nouvelleTransparenceDto) => {
    try {
      await addTransparencyAsync({
        ...nouvelleTransparenceDto,
        dateEcheance: nouvelleTransparenceDto.dateEcheance || null,
        datePriseDePosteCible: nouvelleTransparenceDto.datePriseDePosteCible || null,
        dateClotureDelaiObservation: nouvelleTransparenceDto.dateClôtureDélaiObservation
      });
      console.log('Voici ma last recorded transparence', lastRecordedTransparence);
    } catch (error) {
      console.error(error);
    } finally {
      if (lastRecordedTransparence) {
        navigate(ROUTE_PATHS.SG.TRANSPARENCE_ID.replace(':id', lastRecordedTransparence.id));
      }
    }
  };

  return (
    <PageContentLayout>
      <Breadcrumb
        id="sg-nouvelle-transparence-breadcrumb"
        ariaLabel="Fil d'Ariane du secrétariat général"
        breadcrumb={breadcrumb}
      />

      <form className="m-auto max-w-[480px]" onSubmit={handleSubmit(onSubmit)}>
        <Controller<FormSchema, 'nomTransparence'>
          name="nomTransparence"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label="Nom de la transparence*"
              id="nom-transparence"
              nativeInputProps={{
                value,
                onChange,
                ...field,
                placeholder: 'Nom de la transparence'
              }}
              state={errors.nomTransparence ? 'error' : 'default'}
              stateRelatedMessage={errors.nomTransparence?.message}
            />
          )}
        />
        <Controller<FormSchema, 'dateTransparence'>
          name="dateTransparence"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
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
        <Controller<FormSchema, 'formation'>
          name="formation"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              label="Formation*"
              nativeSelectProps={{
                value,
                onChange,
                defaultValue: ''
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
        <Controller<FormSchema, 'dateClôtureDélaiObservation'>
          name="dateClôtureDélaiObservation"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label="Clôture du délai d'observation*"
              id="date-cloture-delai-observation"
              nativeInputProps={{
                type: 'date',
                value,
                onChange,
                ...field
              }}
              state={errors.dateClôtureDélaiObservation ? 'error' : 'default'}
              stateRelatedMessage={errors.dateClôtureDélaiObservation?.message}
            />
          )}
        />
        <Controller<FormSchema, 'dateEcheance'>
          name="dateEcheance"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
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
        <Controller<FormSchema, 'datePriseDePosteCible'>
          name="datePriseDePosteCible"
          control={control}
          render={({ field: { value, onChange, ...field } }) => (
            <Input
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
        <Controller<FormSchema, 'fichier'>
          name="fichier"
          control={control}
          render={({ field: { onChange } }) => (
            <Upload
              id="nouvelle-transparence-file-upload"
              className="mb-4"
              nativeInputProps={{
                type: 'file',
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onChange(file);
                  }
                }
              }}
              hint="Format supporté : xlsx."
              label="Fichier*"
              state={errors.fichier ? 'error' : 'default'}
              stateRelatedMessage={errors.fichier?.message}
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
    </PageContentLayout>
  );
};

export default NouvelleTransparence;
