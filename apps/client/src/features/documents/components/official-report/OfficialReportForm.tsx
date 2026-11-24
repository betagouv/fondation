import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, type ChangeEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router';
import z from 'zod';

import { AbsentMemberSelector } from '@/features/documents/components/AbsentMemberSelector';
import { ChairmanSelector } from '@/features/documents/components/ChairmanSelector';
import { JusticeContactSelector } from '@/features/documents/components/JusticeContactSelector';
import { useOfficialReport } from '@/features/documents/context/OfficialReportContext';
import { FormationEnumMessages } from '@/shared/enums/formation.enum';
import { RequiredLabel } from '@/shared/ui/required-label';
import { ToggleSwitch } from '@/shared/ui/toggle-switch';
import { dateOnlyCodec, dateOnlyToIso, formatDateOnly } from '@/utils/date-only.util';
import { normalizeSessionName } from '@/utils/session.utils';
import { capitalize } from '@/utils/string.utils';
import { formTimeOnlyCodec, timeOnlyToDate, timeOnlyToString } from '@/utils/time-only.util';
import { memberFullName, toInitials } from '@/utils/user.utils';
import {
  useListAgendasForNewOfficialReportQuery,
  useListSecretariesGeneralQuery,
} from '@queries/agenda.queries';

const OfficialReportMetadataSchema = z
  .object({
    sessionMeetingDate: dateOnlyCodec,
    sessionMeetingStartingTime: formTimeOnlyCodec,
    sessionMeetingEndingTime: formTimeOnlyCodec,
    hasRenunciation: z.boolean(),
    justiceContactId: z.string().nonempty('Veuillez sélectionner un représentant DSJ'),
    chairmanId: z.uuid('Veuillez sélectionner un président'),
    secretaryId: z.uuid('Veuillez sélectionner un secrétaire'),
    memberIds: z.array(z.uuid()),
    agendaId: z.string().nonempty('Veuillez sélectionner un ordre du jour'),
  })
  .superRefine(({ sessionMeetingStartingTime, sessionMeetingEndingTime }, ctx) => {
    const start = timeOnlyToDate(sessionMeetingStartingTime);
    if (!start) {
      ctx.issues.push({
        path: ['sessionMeetingStartingTime'],
        code: 'invalid_type',
        expected: 'string',
        input: sessionMeetingStartingTime,
      });
    }

    const end = timeOnlyToDate(sessionMeetingEndingTime);
    if (!end) {
      ctx.issues.push({
        path: ['sessionMeetingEndingTime'],
        code: 'invalid_type',
        expected: 'string',
        input: sessionMeetingEndingTime,
      });
    }

    if (start && end && start.getTime() > end.getTime()) {
      ctx.issues.push({
        path: ['sessionMeetingStartingTime'],
        code: 'custom',
        input: sessionMeetingStartingTime,
        message: `L'heure de début doit être avant l'heure de fin`,
      });
      ctx.issues.push({
        path: ['sessionMeetingEndingTime'],
        code: 'custom',
        input: sessionMeetingEndingTime,
        message: `L'heure de fin doit être après l'heure de début`,
      });
    }
  });

export function OfficialReportForm() {
  const {
    cancel,
    changedSinceValidation,
    officialReportId,
    recordedMemberIds,
    report: metadata,
    session,
    submit,
  } = useOfficialReport();
  const { formatMessage } = useIntl();
  const { state } = useLocation();
  const requestedAgendaId: string | null = typeof state?.agendaId === 'string' ? state.agendaId : null;

  const { data: secretariesData, isFetching: isFetchingSecretaries } = useListSecretariesGeneralQuery();

  const { data: agendas, isFetchedAfterMount: areAgendasFresh } = useListAgendasForNewOfficialReportQuery({
    sessionId: session.id,
    ignoreOfficialReportId: officialReportId ?? undefined,
  });

  const secretaries = useMemo(() => secretariesData?.items ?? [], [secretariesData]);
  const isRequestedAgendaListed = agendas?.items.some(({ id }) => id === requestedAgendaId) ?? false;
  // the table's button names the agenda: it stays chosen unless the fresh list no longer offers it
  const lockedAgendaId =
    !officialReportId && (!areAgendasFresh || isRequestedAgendaListed) ? requestedAgendaId : null;

  const defaultValues = useMemo(
    () => ({
      sessionMeetingDate: dateOnlyToIso(metadata?.sessionMeetingDate) ?? format(new Date(), 'yyyy-MM-dd'),
      sessionMeetingStartingTime: metadata?.sessionMeetingStartingTime
        ? (timeOnlyToString(metadata.sessionMeetingStartingTime, 'HH:mm') ?? '')
        : '',
      sessionMeetingEndingTime: metadata?.sessionMeetingEndingTime
        ? (timeOnlyToString(metadata.sessionMeetingEndingTime, 'HH:mm') ?? '')
        : '',
      hasRenunciation: metadata?.hasRenunciation ?? true,
      justiceContactId: metadata?.justiceContactId ?? '',
      chairmanId: metadata?.chairmanId ?? '',
      secretaryId: metadata?.secretaryId ?? '',
      memberIds: metadata?.memberIds ?? ([] as string[]),
      agendaId: metadata?.agendaId ?? '',
    }),
    [metadata],
  );

  const {
    control,
    getValues,
    setValue,
    setValues,
    handleSubmit,
    subscribe,
    formState: { errors, isDirty, isValid, dirtyFields },
  } = useForm({
    mode: 'all',
    defaultValues,
    resolver: zodResolver(OfficialReportMetadataSchema),
  });

  useEffect(() => {
    if (!secretaries.length || dirtyFields.secretaryId || metadata?.secretaryId) return;

    const secretary = secretaries.find((m) => m.title === 'FIRST_SECRETARY');
    if (secretary) {
      setValue('secretaryId', secretary.id, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  }, [secretaries, metadata, dirtyFields, setValue]);

  useEffect(() => {
    const unsubscribe = subscribe({
      name: 'agendaId',
      formState: { values: true, dirtyFields: true },
      callback: (state) => {
        // setValues below notifies without a name, which reaches this subscription too
        if (state.name !== 'agendaId') return;

        const agenda = (agendas?.items ?? []).find((agenda) => agenda.id === state.values.agendaId);
        if (!agenda) return;

        const plan = agenda.presentationPlan;
        const startTime = plan?.startTime ? formTimeOnlyCodec.encode(plan.startTime) : '';
        const endTime = plan?.endTime ? formTimeOnlyCodec.encode(plan.endTime) : '';

        // only the fields the agenda fills: validating the others flags them before the user gets to them
        setValues(
          {
            ...(agenda.chairman.id ? { chairmanId: agenda.chairman.id } : {}),
            ...(plan && !plan.hasRenunciation ? { hasRenunciation: false } : {}),
            ...(plan?.justiceContactId ? { justiceContactId: plan.justiceContactId } : {}),
            ...(plan?.absentMembers ? { memberIds: [...plan.absentMembers] } : {}),
            ...(plan?.secretaryId ? { secretaryId: plan.secretaryId } : {}),
            sessionMeetingDate: dateOnlyToIso(plan?.date ?? agenda.sessionMeetingDate),
            ...(endTime ? { sessionMeetingEndingTime: endTime } : {}),
            ...(startTime ? { sessionMeetingStartingTime: startTime } : {}),
          },
          { shouldDirty: true, shouldTouch: true, shouldValidate: true },
        );
      },
    });

    return unsubscribe;
  }, [subscribe, setValues, agendas]);

  // a cached list can predate the notice and the selection is never redone once the fresh one arrives
  useEffect(() => {
    if (!areAgendasFresh || !lockedAgendaId || getValues('agendaId')) return;

    setValue('agendaId', lockedAgendaId, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  }, [areAgendasFresh, getValues, lockedAgendaId, setValue]);

  // a failed creation refreshes the list: an agenda that got its report meanwhile must be chosen again
  useEffect(() => {
    if (officialReportId || !areAgendasFresh) return;

    const agendaId = getValues('agendaId');
    if (agendaId && !agendas?.items.some(({ id }) => id === agendaId)) {
      setValue('agendaId', '', { shouldValidate: true });
    }
  }, [agendas, areAgendasFresh, getValues, officialReportId, setValue]);

  const onAgendaSelected = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const agendaId: string = event.currentTarget.value;
      if (!agendaId) return;

      setValue('agendaId', agendaId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  return (
    <form onSubmit={handleSubmit(submit)} className="mx-auto max-w-2xl">
      <Controller
        name="agendaId"
        control={control}
        render={({ field }) => (
          <Select
            disabled={
              Boolean(officialReportId) || lockedAgendaId !== null || (agendas?.items ?? []).length === 0
            }
            hint={
              field.value === lockedAgendaId ? (
                <FormattedMessage defaultMessage="Choisi depuis le tableau de la documentation" />
              ) : undefined
            }
            label={
              <RequiredLabel>
                <FormattedMessage defaultMessage="Ordre du jour" />
              </RequiredLabel>
            }
            nativeSelectProps={{ ...field, onChange: onAgendaSelected }}
            state={errors.agendaId ? 'error' : 'default'}
            stateRelatedMessage={errors.agendaId?.message}
          >
            <option value="" disabled>
              <FormattedMessage defaultMessage="Sélectionner un ordre du jour" />
            </option>
            {(agendas?.items ?? []).map((agenda) => (
              <option value={agenda.id} key={agenda.id}>
                <FormattedMessage
                  defaultMessage={`ODJ {date} - {name} - {initials} - {formation}`}
                  values={{
                    date: formatDateOnly(agenda.sessionMeetingDate),
                    initials: toInitials(agenda.chairman),
                    name: normalizeSessionName(agenda.session),
                    formation: capitalize(formatMessage(FormationEnumMessages[agenda.formation])),
                  }}
                />
              </option>
            ))}
          </Select>
        )}
      />

      <Controller
        name="sessionMeetingDate"
        control={control}
        render={({ field }) => (
          <Input
            label={
              <FormattedMessage
                defaultMessage={`<mandatory>Date de la séance</mandatory>`}
                values={{ mandatory: (chunk) => <RequiredLabel>{chunk}</RequiredLabel> }}
              />
            }
            nativeInputProps={{ type: 'date', ...field }}
            state={errors.sessionMeetingDate ? 'error' : 'default'}
            stateRelatedMessage={errors.sessionMeetingDate?.message}
          />
        )}
      />

      <Controller
        name="sessionMeetingStartingTime"
        control={control}
        render={({ field }) => (
          <Input
            label={
              <RequiredLabel>
                <FormattedMessage defaultMessage="Heure de début de la séance" />
              </RequiredLabel>
            }
            nativeInputProps={{ type: 'time', ...field }}
            state={errors.sessionMeetingStartingTime ? 'error' : 'default'}
            stateRelatedMessage={errors.sessionMeetingStartingTime?.message}
          />
        )}
      />

      <Controller
        name="sessionMeetingEndingTime"
        control={control}
        render={({ field }) => (
          <Input
            label={
              <RequiredLabel>
                <FormattedMessage defaultMessage="Heure de fin de la séance" />
              </RequiredLabel>
            }
            nativeInputProps={{ type: 'time', ...field }}
            state={errors.sessionMeetingEndingTime ? 'error' : 'default'}
            stateRelatedMessage={errors.sessionMeetingEndingTime?.message}
          />
        )}
      />

      <ChairmanSelector
        formation={session.formation}
        // oxlint-disable-next-line typescript/no-explicit-any
        control={control as any}
        includeIds={recordedMemberIds}
        name="chairmanId"
      />

      <AbsentMemberSelector
        name="memberIds"
        formation={session.formation}
        // oxlint-disable-next-line typescript/no-explicit-any
        control={control as any}
        includeIds={recordedMemberIds}
      />

      <Controller
        control={control}
        name="secretaryId"
        render={({ field }) => (
          <Select
            disabled={field.disabled || isFetchingSecretaries}
            label={
              <RequiredLabel>
                <FormattedMessage defaultMessage={'Secrétaire général'} />
              </RequiredLabel>
            }
            nativeSelectProps={{
              value: field.value,
              onChange: (e) => field.onChange(e.target.value),
            }}
            state={errors.secretaryId ? 'error' : undefined}
            stateRelatedMessage={errors.secretaryId?.message}
          >
            <option value="" disabled>
              <FormattedMessage defaultMessage={'Sélectionner le secrétaire général'} />
            </option>

            {secretaries.map((s) => (
              <option key={s.id} value={s.id}>
                {memberFullName(s)}
              </option>
            ))}
          </Select>
        )}
      />

      <JusticeContactSelector
        label={
          <RequiredLabel>
            <FormattedMessage defaultMessage={`Représentant DSJ`} />
          </RequiredLabel>
        }
        // oxlint-disable-next-line typescript/no-explicit-any
        control={control as any}
        name="justiceContactId"
      />

      <Controller
        name="hasRenunciation"
        control={control}
        render={({ field }) => (
          <ToggleSwitch
            label={
              <FormattedMessage
                defaultMessage={`Renonciation du ministère au délai de convocation de huit jours`}
              />
            }
            checked={field.value}
            onChange={field.onChange}
            name={field.name}
            disabled={field.disabled}
          />
        )}
      />

      <ButtonsGroup
        className="fr-mt-6v"
        alignment="right"
        inlineLayoutWhen="md and up"
        buttons={[
          { children: 'Annuler', priority: 'secondary', onClick: cancel, type: 'button' },
          {
            children: officialReportId ? (
              <FormattedMessage defaultMessage="Mettre à jour" />
            ) : (
              <FormattedMessage defaultMessage="Générer le PV" />
            ),
            disabled:
              !isValid || (Boolean(officialReportId) && !isDirty && changedSinceValidation.length === 0),
            type: 'submit',
          },
        ]}
      />
    </form>
  );
}
