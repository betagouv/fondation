import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
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

/** null while the type is missing or a type requiring positions has none */
function completeOf(
  draft: Draft,
  form: FoundCallForApplicationsFormDto | undefined,
): CreateCallForApplicationsDto | null {
  const { type } = draft;
  if (!type || !form) return null;

  const required = form.types.find(({ id }) => id === type)?.targetPositionsRequired ?? false;
  const targetPositions = required
    ? form.targetPositions.map(({ id }) => id).filter((id) => draft.targetPositions?.includes(id))
    : [];
  if (required && targetPositions.length === 0) return null;

  return {
    comment: draft.comment?.trim() || null,
    deadline: draft.deadline || null,
    publishedOn: draft.publishedOn || null,
    targetPositions,
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
  const type = form.types.find(({ id }) => id === draft.type);
  const checkedPositions = draft.targetPositions ?? [];
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
        <div>
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
          {type && <p className="fr-hint-text fr-mt-2v fr-mb-0">{type.scope}</p>}
        </div>
      </div>
      {type?.targetPositionsRequired && (
        <Checkbox
          className="fr-mb-0"
          legend={
            <RequiredLabel>
              <FormattedMessage defaultMessage="Postes cibles" />
            </RequiredLabel>
          }
          options={form.targetPositions.map(({ id, label }) => ({
            label,
            nativeInputProps: {
              checked: checkedPositions.includes(id),
              onChange: (event) =>
                onChange({
                  targetPositions: event.target.checked
                    ? [...checkedPositions, id]
                    : checkedPositions.filter((position) => position !== id),
                }),
              value: id,
            },
          }))}
          orientation="horizontal"
        />
      )}
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
            nativeInputProps={{ ...dateInput('deadline'), min: draft.publishedOn || form.dateRange.min }}
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
    targetPositions: call.targetPositions.map(({ id }) => id),
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
  const initial: Draft = props.edited ? draftOf(props.edited) : {};
  const shown = draft ?? initial;
  const complete = completeOf(shown, form.data);
  // nothing to save while the form still holds the values saved
  const isUnchanged =
    !!props.edited && JSON.stringify(complete) === JSON.stringify(completeOf(initial, form.data));

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
              <FormattedMessage defaultMessage="Les valeurs actuelles seront remplacées et ne seront pas conservées." />
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
