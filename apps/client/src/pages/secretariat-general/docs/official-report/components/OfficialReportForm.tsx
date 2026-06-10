import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import z from 'zod';

import { AbsentMemberSelector } from '../../components/AbsentMemberSelector';
import { ChairmanSelector } from '../../components/ChairmanSelector';
import { JusticeContactSelector } from '../../components/JusticeContactSelector';
import { useOfficialReport } from '../context/OfficialReportContext';
import { Mandatory } from '@/components/shared/Mandatory';
import { FormationEnumLabel } from '@/types/enums.types';
import { dateOnlyCodec, dateOnlyToDate } from '@/utils/date-only.util';
import { normalizeSessionName } from '@/utils/session.utils';
import { capitalize } from '@/utils/string.utils';
import { formTimeOnlyCodec, timeOnlyToDate, timeOnlyToString } from '@/utils/time-only.util';
import { toFullName, toInitials } from '@/utils/user.utils';
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
  const { session, report: metadata, officialReportId, submit, cancel } = useOfficialReport();

  const { data: secretariesData, isFetching: isFetchingSecretaries } = useListSecretariesGeneralQuery();

  const { data: agendas } = useListAgendasForNewOfficialReportQuery({
    sessionId: session.id,
    ignoreOfficialReportId: officialReportId ?? undefined,
  });

  const secretaries = React.useMemo(() => secretariesData?.items ?? [], [secretariesData]);

  const defaultValues = React.useMemo(
    () => ({
      sessionMeetingDate: format(dateOnlyToDate(metadata?.sessionMeetingDate) ?? new Date(), 'yyyy-MM-dd'),
      sessionMeetingStartingTime: metadata?.sessionMeetingStartingTime
        ? (timeOnlyToString({ hours: 0, minutes: 0, ...metadata.sessionMeetingStartingTime }, 'HH:mm') ?? '')
        : '',
      sessionMeetingEndingTime: metadata?.sessionMeetingEndingTime
        ? (timeOnlyToString({ hours: 0, minutes: 0, ...metadata.sessionMeetingEndingTime }, 'HH:mm') ?? '')
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
    setValue,
    setValues,
    handleSubmit,
    subscribe,
    formState: { errors, isValid, dirtyFields },
  } = useForm({
    mode: 'all',
    defaultValues,
    resolver: zodResolver(OfficialReportMetadataSchema),
  });

  React.useEffect(() => {
    if (!secretaries.length || dirtyFields.secretaryId || metadata?.secretaryId) return;

    const secretary = secretaries.find((m) => m.title === 'FIRST_SECRETARY');
    if (secretary) {
      setValue('secretaryId', secretary.id, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
  }, [secretaries, metadata, dirtyFields, setValue]);

  React.useEffect(() => {
    const unsubscribe = subscribe({
      name: 'agendaId',
      formState: { values: true, dirtyFields: true },
      callback: (state) => {
        const agenda = (agendas?.items ?? []).find((agenda) => agenda.id === state.values.agendaId);
        if (!agenda) return;

        setValues(
          (form) => ({
            ...form,
            chairmanId:
              !state.dirtyFields?.chairmanId && agenda.chairman.id ? agenda.chairman.id : form.chairmanId,
            secretaryId:
              !state.dirtyFields?.secretaryId && agenda.presentationPlan?.secretaryId
                ? agenda.presentationPlan.secretaryId
                : form.secretaryId,
            justiceContactId:
              !state.dirtyFields?.justiceContactId && agenda.presentationPlan?.justiceContactId
                ? agenda.presentationPlan.justiceContactId
                : form.justiceContactId,
            sessionMeetingDate:
              !state.dirtyFields?.sessionMeetingDate && agenda.sessionMeetingDate
                ? dateOnlyToDate(agenda.sessionMeetingDate).toISOString().split('T')[0]
                : form.sessionMeetingDate,
            sessionMeetingStartingTime:
              !state.dirtyFields?.sessionMeetingStartingTime && agenda.presentationPlan?.startTime
                ? formTimeOnlyCodec.encode(agenda.presentationPlan.startTime) ||
                  form.sessionMeetingStartingTime
                : form.sessionMeetingStartingTime,
            sessionMeetingEndingTime:
              !state.dirtyFields?.sessionMeetingEndingTime && agenda.presentationPlan?.endTime
                ? formTimeOnlyCodec.encode(agenda.presentationPlan.endTime) || form.sessionMeetingEndingTime
                : form.sessionMeetingEndingTime,
            memberIds:
              !state?.dirtyFields?.memberIds && agenda.presentationPlan?.absentMembers
                ? [...agenda.presentationPlan.absentMembers]
                : form.memberIds,
            hasRenunciation:
              !state?.dirtyFields?.hasRenunciation &&
              agenda.presentationPlan &&
              !agenda.presentationPlan.hasRenunciation
                ? agenda.presentationPlan.hasRenunciation
                : form.hasRenunciation,
          }),
          { shouldDirty: true, shouldTouch: true, shouldValidate: true },
        );
      },
    });

    return unsubscribe;
  }, [subscribe, setValues, agendas]);

  const onAgendaSelected = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const agendaId: string = event.currentTarget.value;
      if (!agendaId) return;

      setValue('agendaId', agendaId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      const agenda = agendas?.items.find(({ id }) => id === agendaId);
      if (!agenda || !agenda.chairman.id) return;

      setValue('chairmanId', agenda.chairman.id, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [agendas, setValue],
  );

  return (
    <form onSubmit={handleSubmit(submit)} className="mx-auto max-w-2xl">
      <Controller
        name="agendaId"
        control={control}
        render={({ field }) => (
          <Select
            disabled={(agendas?.items ?? []).length === 0}
            state={errors.agendaId ? 'error' : 'default'}
            stateRelatedMessage={errors.agendaId?.message}
            nativeSelectProps={{ ...field, onChange: onAgendaSelected }}
            label={
              <Mandatory>
                <FormattedMessage defaultMessage="Ordre du jour" />
              </Mandatory>
            }
          >
            <option value="" disabled>
              <FormattedMessage defaultMessage="Sélectionner un ordre du jour" />
            </option>
            {(agendas?.items ?? []).map((agenda) => (
              <option value={agenda.id} key={agenda.id}>
                <FormattedMessage
                  defaultMessage={`ODJ {date, date, dateOnlyShort} - {name} - {initials} - {formation}`}
                  values={{
                    date: dateOnlyToDate(agenda.sessionMeetingDate),
                    initials: toInitials(agenda.chairman),
                    name: normalizeSessionName(agenda.session),
                    formation: capitalize(FormationEnumLabel[agenda.formation]),
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
                values={{ mandatory: (chunk) => <Mandatory>{chunk}</Mandatory> }}
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
              <Mandatory>
                <FormattedMessage defaultMessage="Heure de début de la séance" />
              </Mandatory>
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
              <Mandatory>
                <FormattedMessage defaultMessage="Heure de fin de la séance" />
              </Mandatory>
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
        name="chairmanId"
      />

      <AbsentMemberSelector
        name="memberIds"
        formation={session.formation}
        // oxlint-disable-next-line typescript/no-explicit-any
        control={control as any}
      />

      <Controller
        control={control}
        name="secretaryId"
        render={({ field }) => (
          <Select
            disabled={field.disabled || isFetchingSecretaries}
            label={
              <Mandatory>
                <FormattedMessage defaultMessage={'Secrétaire général'} />
              </Mandatory>
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
                {toFullName(s)}
              </option>
            ))}
          </Select>
        )}
      />

      <JusticeContactSelector
        label={
          <Mandatory>
            <FormattedMessage defaultMessage={`Représentant DSJ`} />
          </Mandatory>
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
        className="mt-6"
        alignment="right"
        inlineLayoutWhen="md and up"
        buttons={[
          { children: 'Annuler', priority: 'secondary', onClick: cancel, type: 'button' },
          {
            type: 'submit',
            disabled: !isValid,
            children: <FormattedMessage defaultMessage="Générer le PV" />,
          },
        ]}
      />
    </form>
  );
}
