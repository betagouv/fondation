import { ButtonsGroup } from '@codegouvfr/react-dsfr/ButtonsGroup';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Input from '@codegouvfr/react-dsfr/Input';
import Notice from '@codegouvfr/react-dsfr/Notice';
import Select from '@codegouvfr/react-dsfr/Select';
import { Upload } from '@codegouvfr/react-dsfr/Upload';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useCallback, useRef } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import { RequiredLabel } from '@/shared/ui/required-label';
import { FormationEnum, FormationEnumLabel } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { getSgBreadCrumb } from '@/utils/sg-breadcrumb.utils';
import { capitalize } from '@/utils/string.utils';
import { useCreateNominationSessionFromLodamMutation } from '@queries/nomination-sessions.queries';

import { UploadExcelFailedAlert } from './UploadExcelFailedAlert';

const mandatoryField = 'Champ obligatoire.';
const invalidDateFormat = 'Format de date invalide.';
const optionalDate = z.iso.date(invalidDateFormat).optional();

const nouvelleTransparenceDtoSchema = z.object({
  name: z
    .string({
      message: mandatoryField,
    })
    .trim()
    .min(1, mandatoryField),
  date: z.iso.date(invalidDateFormat),
  formation: z.enum(FormationEnum, { message: mandatoryField }),
  dueDate: optionalDate,
  positionStartDate: optionalDate,
  observationClosingDate: z.iso.date(invalidDateFormat),
  file: z
    .instanceof(File, { message: mandatoryField })
    .refine((file) => file.size > 0, {
      message: mandatoryField,
    })
    .refine(
      (file) => {
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        return validTypes.includes(file.type);
      },
      { error: 'Veuillez importer un fichier au bon format.' },
    ),
});

type FormSchema = z.infer<typeof nouvelleTransparenceDtoSchema>;

function NouvelleTransparence() {
  const { formatMessage } = useIntl();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const breadcrumb = getSgBreadCrumb(ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE);
  const {
    mutate: addTransparency,
    error: transparenceUploadError,
    reset: resetTransparencyMutation,
    isPending,
  } = useCreateNominationSessionFromLodamMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormSchema>({
    resolver: zodResolver(nouvelleTransparenceDtoSchema),
  });

  const onSubmit: SubmitHandler<FormSchema> = useCallback(
    (dto) => {
      resetTransparencyMutation();
      addTransparency(dto, {
        onSuccess: (_, { name }) => {
          resetTransparencyMutation();
          if (inputRef.current) {
            inputRef.current.value = '';
            inputRef.current.files = null;
          }

          return navigate(ROUTE_PATHS.SG.MANAGE_SESSION, { state: { success: name } });
        },
      });
    },
    [resetTransparencyMutation, addTransparency, navigate],
  );

  return (
    <PageContentLayout>
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane du secrétariat général" })}
        breadcrumb={breadcrumb}
        id="sg-nouvelle-transparence-breadcrumb"
      />

      <Notice
        className="fr-mb-6v mx-auto max-w-[480px]"
        description={
          <>
            L'application est directement connecté à LOLFI. L'import depuis une extract LODAM après le{' '}
            <span
              className={clsx(
                cx('ri-calendar-2-fill'),
                'font-medium underline before:mr-1 before:mb-1 before:size-4! before:align-middle before:content-[""]',
              )}
            >
              1<sup>er</sup> avril
            </span>{' '}
            risque de créer des doublons.
          </>
        }
        severity="warning"
        title={formatMessage({ defaultMessage: 'Risque de doublons' })}
      />

      {transparenceUploadError ? (
        <UploadExcelFailedAlert
          // oxlint-disable-next-line @typescript-eslint/no-explicit-any
          validationErrors={(transparenceUploadError as any).validationErrors}
        />
      ) : null}

      <form className="m-auto max-w-120" onSubmit={handleSubmit(onSubmit)}>
        <Controller<FormSchema, 'name'>
          control={control}
          name="name"
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label={
                <RequiredLabel>
                  <FormattedMessage defaultMessage="Nom de la transparence" />
                </RequiredLabel>
              }
              id="nom-transparence"
              nativeInputProps={{
                value,
                onChange,
                ...field,
                placeholder: formatMessage({ defaultMessage: 'Nom de la transparence' }),
              }}
              state={errors.name ? 'error' : 'default'}
              stateRelatedMessage={errors.name?.message}
            />
          )}
        />
        <Controller<FormSchema, 'date'>
          control={control}
          name="date"
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label={
                <RequiredLabel>
                  <FormattedMessage defaultMessage="Date de la transparence" />
                </RequiredLabel>
              }
              id="date-transparence"
              nativeInputProps={{
                type: 'date',
                value,
                onChange,
                ...field,
              }}
              state={errors.date ? 'error' : 'default'}
              stateRelatedMessage={errors.date?.message}
            />
          )}
        />
        <Controller<FormSchema, 'formation'>
          control={control}
          name="formation"
          render={({ field: { value, onChange } }) => (
            <Select
              label={
                <RequiredLabel>
                  <FormattedMessage defaultMessage="Formation" />
                </RequiredLabel>
              }
              nativeSelectProps={{
                value,
                onChange,
                defaultValue: '',
              }}
              state={errors.formation ? 'error' : 'default'}
              stateRelatedMessage={errors.formation?.message}
            >
              <option disabled></option>
              <option value={FormationEnum.SIEGE}>{capitalize(FormationEnumLabel.SIEGE)}</option>
              <option value={FormationEnum.PARQUET}>{capitalize(FormationEnumLabel.PARQUET)}</option>
            </Select>
          )}
        />
        <Controller<FormSchema, 'observationClosingDate'>
          control={control}
          name="observationClosingDate"
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label={
                <RequiredLabel>
                  <FormattedMessage defaultMessage="Clôture du délai d'observation" />
                </RequiredLabel>
              }
              id="date-cloture-delai-observation"
              nativeInputProps={{
                type: 'date',
                value,
                onChange,
                ...field,
              }}
              state={errors.observationClosingDate ? 'error' : 'default'}
              stateRelatedMessage={errors.observationClosingDate?.message}
            />
          )}
        />
        <Controller<FormSchema, 'dueDate'>
          control={control}
          name="dueDate"
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label={formatMessage({ defaultMessage: "Date d'échéance" })}
              id="date-echeance"
              nativeInputProps={{
                type: 'date',
                value,
                onChange,
                ...field,
              }}
              state={errors.dueDate ? 'error' : 'default'}
              stateRelatedMessage={errors.dueDate?.message}
            />
          )}
        />
        <Controller<FormSchema, 'positionStartDate'>
          control={control}
          name="positionStartDate"
          render={({ field: { value, onChange, ...field } }) => (
            <Input
              label={formatMessage({ defaultMessage: 'Date de prise de poste' })}
              id="date-prise-de-poste"
              nativeInputProps={{
                type: 'date',
                value,
                onChange,
                ...field,
              }}
              state={errors.positionStartDate ? 'error' : 'default'}
              stateRelatedMessage={errors.positionStartDate?.message}
            />
          )}
        />
        <Controller<FormSchema, 'file'>
          control={control}
          name="file"
          render={({ field: { onChange } }) => (
            <Upload
              id="nouvelle-transparence-file-upload"
              className="fr-mb-4v"
              nativeInputProps={{
                type: 'file',
                ref: inputRef,
                onChange: (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    resetTransparencyMutation();
                    onChange(file);
                  }
                },
              }}
              hint={formatMessage({ defaultMessage: 'Format supporté : xlsx.' })}
              label={
                <RequiredLabel>
                  <FormattedMessage defaultMessage="Fichier" />
                </RequiredLabel>
              }
              state={errors.file ? 'error' : 'default'}
              stateRelatedMessage={errors.file?.message}
            />
          )}
        />
        <ButtonsGroup
          buttons={[
            {
              id: 'annuler',
              children: formatMessage({ defaultMessage: 'Annuler' }),
              priority: 'tertiary',
              type: 'reset',
              onClick: () => {
                reset();
              },
            },
            {
              id: 'enregistrer',
              children: formatMessage({ defaultMessage: 'Enregistrer' }),
              type: 'submit',
              disabled: isPending,
            },
          ]}
          inlineLayoutWhen="always"
        />
      </form>
    </PageContentLayout>
  );
}

export default NouvelleTransparence;
