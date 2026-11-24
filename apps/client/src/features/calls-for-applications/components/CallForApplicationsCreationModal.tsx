import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import { useId, useState, type FormEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { LoadFailure } from '@/shared/ui/load-failure';
import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import { useToasts } from '@/shared/ui/toast';
import { ValidationError } from '@/utils/validation-error';
import type { CreateCallForApplicationsDto, FoundCallForApplicationsFormDto } from '@api/types';
import {
  useCallForApplicationsFormQuery,
  useCreateCallForApplicationsMutation,
} from '@queries/calls-for-applications.queries';

type Draft = Partial<CreateCallForApplicationsDto>;
type DateField = 'deadline' | 'publishedOn';

function completeOf(draft: Draft): CreateCallForApplicationsDto | null {
  const { targetJurisdictionType, type } = draft;
  if (!targetJurisdictionType || !type) return null;

  return {
    comment: draft.comment?.trim() || null,
    deadline: draft.deadline || null,
    publishedOn: draft.publishedOn || null,
    targetJurisdictionType,
    type,
  };
}

function CallForApplicationsFields(props: {
  deadlineError: string | null;
  draft: Draft;
  form: FoundCallForApplicationsFormDto;
  onChange: (changes: Draft) => void;
}) {
  const { formatMessage } = useIntl();
  const { draft, form, onChange } = props;
  const dateInput = (field: DateField) => ({
    max: form.dateRange.max,
    min: form.dateRange.min,
    onChange: (event: { target: { value: string } }) => onChange({ [field]: event.target.value }),
    type: 'date' as const,
    value: draft[field] ?? '',
  });

  return (
    <>
      <div className="grid gap-x-6 gap-y-8 md:grid-cols-2">
        <Select
          className="fr-mb-0"
          label={
            <RequiredLabel>
              <FormattedMessage defaultMessage="Type d'appel" />
            </RequiredLabel>
          }
          nativeSelectProps={{
            onChange: (event) =>
              onChange({ type: form.types.find(({ id }) => id === event.target.value)?.id }),
            required: true,
            value: draft.type ?? '',
          }}
        >
          <option disabled hidden value="">
            {formatMessage({ defaultMessage: 'Sélectionner' })}
          </option>
          {form.types.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          className="fr-mb-0"
          label={
            <RequiredLabel>
              <FormattedMessage defaultMessage="Juridiction cible" />
            </RequiredLabel>
          }
          nativeSelectProps={{
            onChange: (event) =>
              onChange({
                targetJurisdictionType: form.targetJurisdictionTypes.find(
                  ({ id }) => id === event.target.value,
                )?.id,
              }),
            required: true,
            value: draft.targetJurisdictionType ?? '',
          }}
        >
          <option disabled hidden value="">
            {formatMessage({ defaultMessage: 'Sélectionner' })}
          </option>
          {form.targetJurisdictionTypes.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      <fieldset className="fr-m-0 fr-p-0 border-0">
        <legend className="fr-mb-2v mx-0 px-0 pb-0 font-semibold text-(--text-label-grey)">
          <FormattedMessage defaultMessage="Période de candidature" />
        </legend>
        <div className="grid gap-x-6 gap-y-8 md:grid-cols-2">
          <Input
            className="fr-mb-0"
            label={<FormattedMessage defaultMessage="Date de publication" />}
            nativeInputProps={dateInput('publishedOn')}
          />
          <Input
            className="fr-mb-0"
            label={<FormattedMessage defaultMessage="Date limite" />}
            nativeInputProps={dateInput('deadline')}
            state={props.deadlineError ? 'error' : 'default'}
            stateRelatedMessage={props.deadlineError}
          />
        </div>
      </fieldset>
      <Input
        className="fr-mb-0"
        label={<FormattedMessage defaultMessage="Commentaire" />}
        nativeTextAreaProps={{
          maxLength: form.commentMaxLength,
          onChange: (event) => onChange({ comment: event.target.value }),
          rows: 4,
          value: draft.comment ?? '',
        }}
        textArea
      />
    </>
  );
}

export function CallForApplicationsCreationModal(props: {
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
}) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const formId = useId();
  const form = useCallForApplicationsFormQuery();
  const create = useCreateCallForApplicationsMutation();
  // the only type is the one the agent picks
  const [draft, setDraft] = useState<Draft | null>(null);
  const shown: Draft = draft ?? {
    type: form.data?.types.length === 1 ? form.data.types[0]?.id : undefined,
  };
  const complete = completeOf(shown);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!complete) return;

    create.mutate(complete, {
      onSuccess: () => {
        toasts.success({ title: formatMessage({ defaultMessage: "L'appel à candidatures a été créé" }) });
        props.onClose();
      },
    });
  };

  return (
    <Modal
      actions={
        <>
          {ValidationError.isOtherFailure(create.error) && (
            <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
              <FormattedMessage defaultMessage="La création a échoué, réessayez" />
            </p>
          )}
          <Button onClick={props.onClose} priority="secondary" type="button">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={create.isPending || !complete} nativeButtonProps={{ form: formId }} type="submit">
            <FormattedMessage defaultMessage="Créer l'appel à candidatures" />
          </Button>
        </>
      }
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      size="large"
      title={formatMessage({ defaultMessage: 'Créer un appel à candidatures' })}
    >
      {form.data ? (
        <form className="fr-mt-6v flex flex-col gap-8" id={formId} onSubmit={submit}>
          <CallForApplicationsFields
            deadlineError={ValidationError.messageOf(create.error)}
            draft={shown}
            form={form.data}
            onChange={(changes) => setDraft({ ...shown, ...changes })}
          />
        </form>
      ) : form.isError ? (
        <div className="fr-mt-6v">
          <LoadFailure
            isRetrying={form.isFetching}
            message={<FormattedMessage defaultMessage="Le formulaire n'a pas pu être chargé" />}
            onRetry={() => void form.refetch()}
          />
        </div>
      ) : null}
    </Modal>
  );
}
