import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { FormationEnum, FormationEnumMessages } from '@/shared/enums/formation.enum';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import { Upload } from '@/shared/ui/upload';
import { capitalize } from '@/utils/string.utils';

import { UploadExcelFailedAlert } from './UploadExcelFailedAlert';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLSX_FILE_TYPES = `${XLSX_MIME_TYPE},.xlsx`;

export type SessionCreationForm = {
  date: string;
  dueDate?: string;
  file: File;
  formation: FormationEnum;
  name: string;
  observationClosingDate: string;
  positionStartDate?: string;
};

function useSessionCreationSchema() {
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
    }) satisfies z.ZodType<SessionCreationForm>;
  }, [formatMessage]);
}

export function SessionCreationModal(props: {
  error: Error | null;
  isSaving: boolean;
  onClose: () => void;
  onClosed: () => void;
  onFileChange: () => void;
  onSave: (session: SessionCreationForm) => void;
  open: boolean;
}) {
  const { formatMessage } = useIntl();
  const formId = useId();
  const schema = useSessionCreationSchema();
  const {
    control,
    formState: { errors, isValid },
    handleSubmit,
  } = useForm<SessionCreationForm>({ resolver: zodResolver(schema) });

  return (
    <Modal
      actions={
        <>
          <Button disabled={props.isSaving} onClick={props.onClose} priority="secondary" type="button">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={props.isSaving || !isValid} nativeButtonProps={{ form: formId }} type="submit">
            <FormattedMessage defaultMessage="Enregistrer" />
          </Button>
        </>
      }
      closeOnBackdrop={false}
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      size="large"
      title={formatMessage({ defaultMessage: 'Créer une session depuis une extraction LODAM' })}
    >
      <AlertBanner
        className="fr-my-6v px-4 py-3"
        icon="fr-icon-warning-fill"
        message={
          <FormattedMessage
            defaultMessage="L'application est connectée à LOLFI. L'import depuis une extraction LODAM après le 1<sup>er</sup> avril 2026 risque de créer des doublons."
            values={{ sup: (chunks) => <sup>{chunks}</sup> }}
          />
        }
        tone="warning"
      />

      {props.error ? (
        <UploadExcelFailedAlert
          // oxlint-disable-next-line @typescript-eslint/no-explicit-any
          validationErrors={(props.error as any).validationErrors}
        />
      ) : null}

      <form id={formId} onSubmit={handleSubmit(props.onSave)}>
        <Controller<SessionCreationForm, 'name'>
          control={control}
          name="name"
          render={({ field: { onChange, value, ...field } }) => (
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
        <Controller<SessionCreationForm, 'formation'>
          control={control}
          name="formation"
          render={({ field: { onChange, value } }) => (
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
          <Controller<SessionCreationForm, 'date'>
            control={control}
            name="date"
            render={({ field: { onChange, value, ...field } }) => (
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
          <Controller<SessionCreationForm, 'observationClosingDate'>
            control={control}
            name="observationClosingDate"
            render={({ field: { onChange, value, ...field } }) => (
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
          <Controller<SessionCreationForm, 'dueDate'>
            control={control}
            name="dueDate"
            render={({ field: { onChange, value, ...field } }) => (
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
          <Controller<SessionCreationForm, 'positionStartDate'>
            control={control}
            name="positionStartDate"
            render={({ field: { onChange, value, ...field } }) => (
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

        <Controller<SessionCreationForm, 'file'>
          control={control}
          name="file"
          render={({ field: { onChange } }) => (
            <div className="fr-mt-4v">
              <Upload
                accept={XLSX_FILE_TYPES}
                hasError={!!errors.file}
                hint={<FormattedMessage defaultMessage="Format supporté : xlsx" />}
                label={
                  <RequiredLabel>
                    <FormattedMessage defaultMessage="Extraction LODAM" />
                  </RequiredLabel>
                }
                onChange={([file]) => {
                  props.onFileChange();
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
      </form>
    </Modal>
  );
}
