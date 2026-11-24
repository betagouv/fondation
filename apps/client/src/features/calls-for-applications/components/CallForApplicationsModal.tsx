import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import { useId, useState, type FormEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { LoadFailure } from '@/shared/ui/load-failure';
import { Modal } from '@/shared/ui/modal';
import { RequiredLabel } from '@/shared/ui/required-label';
import { useToasts } from '@/shared/ui/toast';
import { dateOnlyToIso } from '@/utils/date-only.util';
import { ValidationError } from '@/utils/validation-error';
import type { CreateCallForApplicationsDto, FoundCallForApplicationsFormDto } from '@api/types';
import {
  type CallForApplications,
  useCallForApplicationsFormQuery,
  useCreateCallForApplicationsMutation,
  useUpdateCallForApplicationsMutation,
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

function draftOf(call: CallForApplications): Draft {
  return {
    comment: call.comment ?? '',
    deadline: dateOnlyToIso(call.deadline) ?? '',
    publishedOn: dateOnlyToIso(call.publishedOn) ?? '',
    targetJurisdictionType: call.targetJurisdictionType?.id,
    type: call.type.id,
  };
}

/** creates a call, or updates the one given: every field is then replaced, without going back */
export function CallForApplicationsModal(props: {
  edited: CallForApplications | null;
  onClose: () => void;
  onClosed: () => void;
  open: boolean;
}) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const formId = useId();
  const form = useCallForApplicationsFormQuery();
  const create = useCreateCallForApplicationsMutation();
  const update = useUpdateCallForApplicationsMutation();
  const saving = props.edited ? update : create;
  const [draft, setDraft] = useState<Draft | null>(null);
  // a new call starts on the type when only one exists: the agent picks it anyway
  const initial: Draft = props.edited
    ? draftOf(props.edited)
    : { type: form.data?.types.length === 1 ? form.data.types[0]?.id : undefined };
  const shown = draft ?? initial;
  const complete = completeOf(shown);
  // nothing to save while the form still holds the values saved
  const isUnchanged = !!props.edited && JSON.stringify(complete) === JSON.stringify(completeOf(initial));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!complete) return;

    const onSuccess = () => {
      toasts.success({
        title: props.edited
          ? formatMessage({ defaultMessage: "L'appel à candidatures a été modifié" })
          : formatMessage({ defaultMessage: "L'appel à candidatures a été créé" }),
      });
      props.onClose();
    };
    if (props.edited) update.mutate({ body: complete, callId: props.edited.id }, { onSuccess });
    else create.mutate(complete, { onSuccess });
  };
  const refusal = ValidationError.messageOf(saving.error);

  return (
    <Modal
      actions={
        <>
          {(refusal || ValidationError.isOtherFailure(saving.error)) && (
            <p className="fr-error-text fr-mt-0 mr-auto" role="alert">
              {refusal ??
                (props.edited ? (
                  <FormattedMessage defaultMessage="La modification a échoué, réessayez" />
                ) : (
                  <FormattedMessage defaultMessage="La création a échoué, réessayez" />
                ))}
            </p>
          )}
          <Button onClick={props.onClose} priority="secondary" type="button">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button
            disabled={saving.isPending || !complete || isUnchanged}
            nativeButtonProps={{ form: formId }}
            type="submit"
          >
            {props.edited ? (
              <FormattedMessage defaultMessage="Enregistrer les modifications" />
            ) : (
              <FormattedMessage defaultMessage="Créer l'appel à candidatures" />
            )}
          </Button>
        </>
      }
      // a click beside the form would lose what is typed
      closeOnBackdrop={false}
      onClose={props.onClose}
      onClosed={props.onClosed}
      open={props.open}
      size="large"
      title={
        props.edited
          ? formatMessage({ defaultMessage: "Modifier l'appel à candidatures" })
          : formatMessage({ defaultMessage: 'Créer un appel à candidatures' })
      }
    >
      {form.data ? (
        <form className="fr-mt-6v flex flex-col gap-8" id={formId} onSubmit={submit}>
          {props.edited && (
            <p className="fr-mb-0">
              <FormattedMessage defaultMessage="Les valeurs enregistrées seront remplacées. Il ne sera pas possible de revenir en arrière." />
            </p>
          )}
          <CallForApplicationsFields
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
