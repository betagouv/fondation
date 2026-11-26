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

import { TargetCourtsPicker } from './TargetCourtsPicker';

type CourtGroup = FoundCallForApplicationsFormDto['targetCourtTypes'][number];
type SavedCourts = CallForApplications['targetCourts'];
/** the types of courts checked stay in the draft only: the API reads them from the courts */
type Draft = Partial<CreateCallForApplicationsDto> & { targetCourtTypes?: CourtGroup['type']['id'][] };
type DateField = 'deadline' | 'publishedOn';

/** a court removed from the referential since the call targeted it is no longer offered but stays shown */
function courtGroupsOf(form: FoundCallForApplicationsFormDto, savedCourts: SavedCourts): CourtGroup[] {
  return form.targetCourtTypes.map((group) => ({
    ...group,
    courts: [
      ...group.courts,
      ...savedCourts.filter(
        (saved) => saved.type === group.type.id && !group.courts.some(({ id }) => id === saved.id),
      ),
    ],
  }));
}

/** the types of an edited call are those of its courts */
function checkedTypesOf(draft: Draft, groups: readonly CourtGroup[]): CourtGroup['type']['id'][] {
  return (
    draft.targetCourtTypes ??
    groups
      .filter(({ courts }) => courts.some(({ id }) => draft.targetCourts?.includes(id)))
      .map(({ type }) => type.id)
  );
}

function isEmptyGroup(draft: Draft, group: CourtGroup): boolean {
  return !group.courts.some(({ id }) => draft.targetCourts?.includes(id));
}

/** null while the type is missing or nothing is picked as the target its type requires (a court in each type checked) */
function completeOf(
  draft: Draft,
  form: FoundCallForApplicationsFormDto | undefined,
  savedCourts: SavedCourts,
): CreateCallForApplicationsDto | null {
  const { type } = draft;
  if (!type || !form) return null;

  const pick = form.types.find(({ id }) => id === type)?.targetPick;
  const targetPositions =
    pick === 'POSITIONS'
      ? form.targetPositions.map(({ id }) => id).filter((id) => draft.targetPositions?.includes(id))
      : [];
  // sorted so that a court unchecked then checked again does not count as a change
  const targetCourts = pick === 'COURTS' ? (draft.targetCourts ?? []).toSorted() : [];
  if (pick === 'POSITIONS' && targetPositions.length === 0) return null;
  if (pick === 'COURTS' && targetCourts.length === 0) return null;
  if (pick === 'COURTS') {
    const groups = courtGroupsOf(form, savedCourts);
    const checked = checkedTypesOf(draft, groups);
    if (groups.some((group) => checked.includes(group.type.id) && isEmptyGroup(draft, group))) return null;
  }

  return {
    comment: draft.comment?.trim() || null,
    deadline: draft.deadline || null,
    publishedOn: draft.publishedOn || null,
    targetCourts,
    targetPositions,
    type,
  };
}

function TargetCourtsFields(props: {
  draft: Draft;
  form: FoundCallForApplicationsFormDto;
  onChange: (changes: Draft) => void;
  savedCourts: SavedCourts;
}) {
  const { draft, onChange } = props;
  const groups = courtGroupsOf(props.form, props.savedCourts);
  const checkedCourts = draft.targetCourts ?? [];
  const checkedTypes = checkedTypesOf(draft, groups);
  const uncheck = (group: CourtGroup) =>
    onChange({
      targetCourts: checkedCourts.filter((id) => !group.courts.some((court) => court.id === id)),
      targetCourtTypes: checkedTypes.filter((id) => id !== group.type.id),
    });

  return (
    <>
      <Checkbox
        className="fr-mb-0"
        legend={
          <RequiredLabel>
            <FormattedMessage defaultMessage="Types de juridictions cibles" />
          </RequiredLabel>
        }
        options={groups.map((group) => ({
          label: group.type.label,
          nativeInputProps: {
            checked: checkedTypes.includes(group.type.id),
            onChange: (event) =>
              event.target.checked
                ? onChange({ targetCourtTypes: [...checkedTypes, group.type.id] })
                : uncheck(group),
            value: group.type.id,
          },
        }))}
        orientation="horizontal"
      />
      {groups
        .filter(({ type }) => checkedTypes.includes(type.id))
        .map((group) => (
          <TargetCourtsPicker
            checked={checkedCourts}
            courtGroup={group}
            isEmpty={isEmptyGroup(draft, group)}
            key={group.type.id}
            onChange={(targetCourts) => onChange({ targetCourts, targetCourtTypes: checkedTypes })}
          />
        ))}
    </>
  );
}

function CallForApplicationsFields(props: {
  draft: Draft;
  form: FoundCallForApplicationsFormDto;
  onChange: (changes: Draft) => void;
  savedCourts: CallForApplications['targetCourts'];
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
      {type?.targetPick === 'COURTS' && (
        <TargetCourtsFields draft={draft} form={form} onChange={onChange} savedCourts={props.savedCourts} />
      )}
      {type?.targetPick === 'POSITIONS' && (
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
    targetCourts: call.targetCourts.map(({ id }) => id),
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
  const savedCourts = props.edited?.targetCourts ?? [];
  const complete = completeOf(shown, form.data, savedCourts);
  // nothing to save while the form still holds the values saved
  const isUnchanged =
    !!props.edited &&
    JSON.stringify(complete) === JSON.stringify(completeOf(initial, form.data, savedCourts));

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
            savedCourts={savedCourts}
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
