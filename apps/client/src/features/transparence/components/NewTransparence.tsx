import { ButtonsGroup } from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { FormationEnum, FormationEnumMessages } from '@/shared/enums/formation.enum';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { RequiredLabel } from '@/shared/ui/required-label';
import { Upload } from '@/shared/ui/upload';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import { useCreateNominationSessionFromLodamMutation } from '@queries/nomination-sessions.queries';

import { UploadExcelFailedAlert } from './UploadExcelFailedAlert';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLSX_FILE_TYPES = `${XLSX_MIME_TYPE},.xlsx`;

type FormSchema = {
  date: string;
  dueDate?: string;
  file: File;
  formation: FormationEnum;
  name: string;
  observationClosingDate: string;
  positionStartDate?: string;
};

function useNewTransparenceSchema() {
  const { formatMessage } = useIntl();

  return useMemo(() => {
    const mandatoryField = formatMessage({ defaultMessage: 'Champ obligatoire.' });
    const invalidDateFormat = formatMessage({ defaultMessage: 'Format de date invalide.' });
    const optionalDate = z.iso.date(invalidDateFormat).optional();

    return z.object({
      date: z.iso.date(invalidDateFormat),
      dueDate: optionalDate,
      file: z
        .instanceof(File, { message: mandatoryField })
        .refine((file) => file.size > 0, { message: mandatoryField })
        .refine((file) => file.type === XLSX_MIME_TYPE, {
          message: formatMessage({ defaultMessage: 'Veuillez importer un fichier au bon format.' }),
        }),
      formation: z.enum(FormationEnum, { message: mandatoryField }),
      name: z.string({ message: mandatoryField }).trim().min(1, mandatoryField),
      observationClosingDate: z.iso.date(invalidDateFormat),
      positionStartDate: optionalDate,
    }) satisfies z.ZodType<FormSchema>;
  }, [formatMessage]);
}

export function NewTransparence() {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const schema = useNewTransparenceSchema();
  /** the shared upload keeps no value: a new key is the only way to empty the picker */
  const [uploadKey, setUploadKey] = useState(0);
  const {
    error: transparenceUploadError,
    isPending,
    mutate: addTransparency,
    reset: resetTransparencyMutation,
  } = useCreateNominationSessionFromLodamMutation();

  const {
    control,
    formState: { errors, isDirty, isValid },
    handleSubmit,
    reset,
  } = useForm<FormSchema>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormSchema> = useCallback(
    (dto) => {
      resetTransparencyMutation();
      addTransparency(dto, {
        onSuccess: (_, { name }) => {
          resetTransparencyMutation();
          setUploadKey((key) => key + 1);

          return navigate(ROUTE_PATHS.SG.MANAGE_SESSION, { state: { success: name } });
        },
      });
    },
    [resetTransparencyMutation, addTransparency, navigate],
  );

  const onReset = useCallback(() => {
    reset();
    resetTransparencyMutation();
    setUploadKey((key) => key + 1);
  }, [reset, resetTransparencyMutation]);

  return (
    <div className="fr-pt-8v fr-pb-16v grow bg-(--background-alt-grey)">
      <div className="fr-container">
        <Breadcrumb
          ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane du secrétariat général" })}
          breadcrumb={{
            currentPageLabel: formatMessage({ defaultMessage: 'Créer une session' }),
            segments: [
              {
                label: formatMessage({ defaultMessage: 'Secrétariat général' }),
                to: ROUTE_PATHS.SG.DASHBOARD,
              },
            ],
          }}
          id="sg-new-transparence-breadcrumb"
        />

        <h1 className="fr-h3 fr-mb-8v">
          <FormattedMessage defaultMessage="Créer une session" />
        </h1>

        <Tabs
          classes={{ panel: 'ring-(--border-default-grey) ring-1' }}
          className="shadow-none! before:shadow-none!"
          tabs={[
            {
              content: (
                <form className="fr-py-4v mx-auto max-w-2xl" onSubmit={handleSubmit(onSubmit)}>
                  <AlertBanner
                    className="fr-mb-6v px-4 py-3"
                    icon="fr-icon-warning-fill"
                    message={
                      <FormattedMessage
                        defaultMessage="L'application est connectée à LOLFI. L'import depuis une extraction LODAM après le 1<sup>er</sup> avril 2026 risque de créer des doublons."
                        values={{ sup: (chunks) => <sup>{chunks}</sup> }}
                      />
                    }
                    tone="warning"
                  />

                  {transparenceUploadError ? (
                    <UploadExcelFailedAlert
                      // oxlint-disable-next-line @typescript-eslint/no-explicit-any
                      validationErrors={(transparenceUploadError as any).validationErrors}
                    />
                  ) : null}

                  <Controller<FormSchema, 'name'>
                    control={control}
                    name="name"
                    render={({ field: { value, onChange, ...field } }) => (
                      <Input
                        id="nom-transparence"
                        label={
                          <RequiredLabel>
                            <FormattedMessage defaultMessage="Nom de la transparence" />
                          </RequiredLabel>
                        }
                        nativeInputProps={{
                          ...field,
                          onChange,
                          placeholder: formatMessage({ defaultMessage: 'Nom de la transparence' }),
                          value,
                        }}
                        state={errors.name ? 'error' : 'default'}
                        stateRelatedMessage={errors.name?.message}
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
                          defaultValue: '',
                          onChange,
                          value,
                        }}
                        state={errors.formation ? 'error' : 'default'}
                        stateRelatedMessage={errors.formation?.message}
                      >
                        <option disabled></option>
                        <option value={FormationEnum.SIEGE}>
                          {capitalize(formatMessage(FormationEnumMessages.SIEGE))}
                        </option>
                        <option value={FormationEnum.PARQUET}>
                          {capitalize(formatMessage(FormationEnumMessages.PARQUET))}
                        </option>
                      </Select>
                    )}
                  />
                  <div className="grid gap-x-8 md:grid-cols-2">
                    <Controller<FormSchema, 'date'>
                      control={control}
                      name="date"
                      render={({ field: { value, onChange, ...field } }) => (
                        <Input
                          id="date-transparence"
                          label={
                            <RequiredLabel>
                              <FormattedMessage defaultMessage="Date de la transparence" />
                            </RequiredLabel>
                          }
                          nativeInputProps={{
                            ...field,
                            onChange,
                            type: 'date',
                            value,
                          }}
                          state={errors.date ? 'error' : 'default'}
                          stateRelatedMessage={errors.date?.message}
                        />
                      )}
                    />
                    <Controller<FormSchema, 'observationClosingDate'>
                      control={control}
                      name="observationClosingDate"
                      render={({ field: { value, onChange, ...field } }) => (
                        <Input
                          id="date-cloture-delai-observation"
                          label={
                            <RequiredLabel>
                              <FormattedMessage defaultMessage="Clôture du délai d'observation" />
                            </RequiredLabel>
                          }
                          nativeInputProps={{
                            ...field,
                            onChange,
                            type: 'date',
                            value,
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
                          id="date-echeance"
                          label={formatMessage({ defaultMessage: "Date d'échéance" })}
                          nativeInputProps={{
                            ...field,
                            onChange,
                            type: 'date',
                            value,
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
                          id="date-prise-de-poste"
                          label={formatMessage({ defaultMessage: 'Date de prise de poste' })}
                          nativeInputProps={{
                            ...field,
                            onChange,
                            type: 'date',
                            value,
                          }}
                          state={errors.positionStartDate ? 'error' : 'default'}
                          stateRelatedMessage={errors.positionStartDate?.message}
                        />
                      )}
                    />
                  </div>

                  <Controller<FormSchema, 'file'>
                    control={control}
                    name="file"
                    render={({ field: { onChange } }) => (
                      <div className="fr-mt-4v">
                        <Upload
                          accept={XLSX_FILE_TYPES}
                          hasError={!!errors.file}
                          hint={<FormattedMessage defaultMessage="Format supporté : xlsx" />}
                          key={uploadKey}
                          label={
                            <RequiredLabel>
                              <FormattedMessage defaultMessage="Extraction LODAM" />
                            </RequiredLabel>
                          }
                          onChange={([file]) => {
                            if (!file) return;
                            resetTransparencyMutation();
                            onChange(file);
                          }}
                        />
                        {errors.file && (
                          <p className="fr-error-text" role="alert">
                            {errors.file.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                  <ButtonsGroup
                    alignment="right"
                    className="fr-mt-8v"
                    buttons={[
                      {
                        children: formatMessage({ defaultMessage: 'Réinitialiser' }),
                        disabled: !isDirty,
                        id: 'reinitialiser',
                        onClick: onReset,
                        priority: 'tertiary',
                        type: 'reset',
                      },
                      {
                        children: formatMessage({ defaultMessage: 'Enregistrer' }),
                        disabled: isPending || !isValid,
                        id: 'enregistrer',
                        type: 'submit',
                      },
                    ]}
                    inlineLayoutWhen="always"
                  />
                </form>
              ),
              label: formatMessage({ defaultMessage: 'Depuis une extraction LODAM' }),
            },
          ]}
        />
      </div>
    </div>
  );
}
