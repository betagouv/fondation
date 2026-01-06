import { ButtonsGroup } from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, type FC } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Magistrat } from 'shared-models';
import { z } from 'zod';

import { useCreateNominationSessionFromLodamMutation } from '@queries/nomination-sessions.queries';

import { ROUTE_PATHS } from '../../../../utils/route-path.utils';
import { getSgBreadCrumb } from '../../../../utils/sg-breadcrumb.utils';
import { formationToLabel } from '../../../reports/labels/labels-mappers';
import { Breadcrumb } from '../../../shared/Breadcrumb';
import { PageContentLayout } from '../../../shared/PageContentLayout';
import { UploadExcelFailedAlert } from './UploadExcelFailedAlert';

const mandatoryField = 'Champ obligatoire.';
const invalidDateFormat = 'Format de date invalide.';
const optionalDate = z.string().date(invalidDateFormat).optional();

const nouvelleTransparenceDtoSchema = z.object({
  name: z
    .string({
      message: mandatoryField
    })
    .trim()
    .min(1, mandatoryField),
  date: z.string({ message: mandatoryField }).date(invalidDateFormat),
  formation: z.nativeEnum(Magistrat.Formation, {
    message: mandatoryField
  }),
  dueDate: optionalDate,
  positionStartDate: optionalDate,
  observationClosingDate: z.string({ message: mandatoryField }).date(invalidDateFormat),
  file: z
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
  const breadcrumb = getSgBreadCrumb(ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE);
  const {
    mutateAsync: addTransparencyAsync,
    error: transparenceUploadError,
    reset: resetTransparencyMutation
  } = useCreateNominationSessionFromLodamMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormSchema>({
    resolver: zodResolver(nouvelleTransparenceDtoSchema)
  });

  const onSubmit: SubmitHandler<FormSchema> = useCallback(
    (dto) => {
      resetTransparencyMutation();
      return addTransparencyAsync(dto, {
        onSuccess: (_, { name }) => navigate(ROUTE_PATHS.SG.MANAGE_SESSION, { state: { success: name } })
      });
    },
    [resetTransparencyMutation, addTransparencyAsync, navigate]
  );

  return (
    <PageContentLayout>
      <Breadcrumb
        id="sg-nouvelle-transparence-breadcrumb"
        ariaLabel="Fil d'Ariane du secrétariat général"
        breadcrumb={breadcrumb}
      />

      {transparenceUploadError ? (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <UploadExcelFailedAlert validationErrors={(transparenceUploadError as any).validationErrors} />
      ) : null}

      <form className="m-auto max-w-[480px]" onSubmit={handleSubmit(onSubmit)}>
        <Controller<FormSchema, 'name'>
          name="name"
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
              state={errors.name ? 'error' : 'default'}
              stateRelatedMessage={errors.name?.message}
            />
          )}
        />
        <Controller<FormSchema, 'date'>
          name="date"
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
              state={errors.date ? 'error' : 'default'}
              stateRelatedMessage={errors.date?.message}
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
        <Controller<FormSchema, 'observationClosingDate'>
          name="observationClosingDate"
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
              state={errors.observationClosingDate ? 'error' : 'default'}
              stateRelatedMessage={errors.observationClosingDate?.message}
            />
          )}
        />
        <Controller<FormSchema, 'dueDate'>
          name="dueDate"
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
              state={errors.dueDate ? 'error' : 'default'}
              stateRelatedMessage={errors.dueDate?.message}
            />
          )}
        />
        <Controller<FormSchema, 'positionStartDate'>
          name="positionStartDate"
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
              state={errors.positionStartDate ? 'error' : 'default'}
              stateRelatedMessage={errors.positionStartDate?.message}
            />
          )}
        />
        <Controller<FormSchema, 'file'>
          name="file"
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
                    resetTransparencyMutation();
                    onChange(file);
                  }
                }
              }}
              hint="Format supporté : xlsx."
              label="Fichier*"
              state={errors.file ? 'error' : 'default'}
              stateRelatedMessage={errors.file?.message}
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
