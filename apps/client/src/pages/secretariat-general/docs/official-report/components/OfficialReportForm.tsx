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

import { useOfficialReport } from '../context/OfficialReportContext';
import { Mandatory } from '@/components/shared/Mandatory';
import { dateOnlyCodec, dateOnlyToDate } from '@/utils/date-only.util';
import { formTimeOnlyCodec, timeOnlyToDate, timeOnlyToString } from '@/utils/time-only.util';
import { toFullName } from '@/utils/user.utils';
import {
  useListAgendasForNewOfficialReportQuery,
  useListMembersForNewOfficialReportQuery,
  useListSecretariesGeneralQuery,
} from '@queries/agenda.queries';

import { AbsentMemberSelector } from './AbsentMemberSelector';
import { JusticeContactSelector } from './JusticeContactSelector';

const OfficialReportMetadataSchema = z
  .object({
    sessionMeetingDate: dateOnlyCodec,
    sessionMeetingStartingTime: formTimeOnlyCodec,
    sessionMeetingEndingTime: formTimeOnlyCodec,
    hasRenunciation: z.boolean(),
    justiceDepartmentContactId: z.string().nonempty('Veuillez sélectionner un représentant DSJ'),
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

  const { data: membersData } = useListMembersForNewOfficialReportQuery({ sessionId: session.id });
  const { data: secretariesData } = useListSecretariesGeneralQuery();

  const { data: agendas } = useListAgendasForNewOfficialReportQuery({
    sessionId: session.id,
    ignoreOfficialReportId: officialReportId ?? undefined,
  });

  const secretaries = React.useMemo(() => secretariesData?.items ?? [], [secretariesData]);
  const members = React.useMemo(() => membersData?.items ?? [], [membersData]);
  const chairmen = React.useMemo(
    () =>
      members.filter((m) =>
        m.duty === 'PRESIDENT' && session.formation === 'PARQUET'
          ? m.title === 'DEPUTY_PRESIDENT_PARQUET' || m.title === 'PRESIDENT_PARQUET'
          : m.title === 'DEPUTY_PRESIDENT_SIEGE' || m.title === 'PRESIDENT_SIEGE',
      ),
    [members, session],
  );

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
      justiceDepartmentContactId: metadata?.justiceDepartmentContactId ?? '',
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
    handleSubmit,
    watch,
    subscribe,
    formState: { errors, isValid },
  } = useForm({
    mode: 'all',
    defaultValues,
    resolver: zodResolver(OfficialReportMetadataSchema),
  });

  const selectedChairmanId = watch('chairmanId');

  React.useEffect(() => {
    if (chairmen.length > 0 && !metadata?.chairmanId) {
      const president = chairmen.find((c) =>
        session.formation === 'PARQUET' ? c.title === 'PRESIDENT_PARQUET' : c.title === 'PRESIDENT_SIEGE',
      );
      if (president) setValue('chairmanId', president.id);
    }
  }, [chairmen, session.formation, metadata, setValue]);

  React.useEffect(() => {
    if (secretaries.length > 0 && !metadata?.secretaryId) {
      const secretary = secretaries.find((m) => m.title === 'FIRST_SECRETARY');
      if (secretary) setValue('secretaryId', secretary.id);
    }
  }, [secretaries, metadata, setValue]);

  React.useEffect(() => {
    const unsubscribe = subscribe({
      name: 'agendaId',
      callback: (state) => {
        const agenda = (agendas?.items ?? []).find((agenda) => agenda.id === state.values.agendaId);
        if (!agenda) return;

        if (!state.dirtyFields?.chairmanId && agenda.chairmanId) {
          setValue('chairmanId', agenda.chairmanId);
        }

        if (!state.dirtyFields?.secretaryId && agenda.presentationPlan?.secretaryId) {
          setValue('secretaryId', agenda.presentationPlan.secretaryId);
        }

        if (!state.dirtyFields?.justiceDepartmentContactId && agenda.presentationPlan?.justiceContactId) {
          setValue('justiceDepartmentContactId', agenda.presentationPlan.justiceContactId);
        }

        if (!state.dirtyFields?.sessionMeetingStartingTime && agenda.presentationPlan?.startTime) {
          const startTime = formTimeOnlyCodec.encode(agenda.presentationPlan.startTime);
          if (startTime) setValue('sessionMeetingStartingTime', startTime);
        }

        if (!state.dirtyFields?.sessionMeetingEndingTime && agenda.presentationPlan?.endTime) {
          const endTime = formTimeOnlyCodec.encode(agenda.presentationPlan.endTime);
          if (endTime) setValue('sessionMeetingEndingTime', endTime);
        }
      },
    });

    return unsubscribe;
  }, [subscribe, setValue, agendas]);

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
      if (!agenda || !agenda.chairmanId) return;

      if (!chairmen.length || !chairmen.some(({ id }) => id === agenda.chairmanId)) return;

      setValue('chairmanId', agenda.chairmanId, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [agendas, chairmen, setValue],
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
                  defaultMessage={`{name} - ODJ du {date, date, dateOnlyShort}`}
                  values={{
                    date: dateOnlyToDate(agenda.date),
                    name: agenda.session.name,
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

      <Controller
        name="chairmanId"
        control={control}
        render={({ field }) => (
          <Select
            label={
              <FormattedMessage
                defaultMessage={`<mandatory>Président de séance</mandatory>`}
                values={{ mandatory: (chunk) => <Mandatory>{chunk}</Mandatory> }}
              />
            }
            nativeSelectProps={{
              value: field.value,
              onChange: (e) => field.onChange(e.target.value),
            }}
            state={errors.chairmanId ? 'error' : 'default'}
            stateRelatedMessage={errors.chairmanId?.message}
          >
            <option value="" disabled>
              Sélectionner le président de séance
            </option>
            {chairmen.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayTitle ? [c.displayTitle, c.lastName.toUpperCase()].join(' ') : toFullName(c)}
              </option>
            ))}
          </Select>
        )}
      />

      <Controller
        name="secretaryId"
        control={control}
        render={({ field }) => (
          <Select
            label={
              <FormattedMessage
                defaultMessage={`<mandatory>Secrétaire Général</mandatory>`}
                values={{ mandatory: (chunk) => <Mandatory>{chunk}</Mandatory> }}
              />
            }
            nativeSelectProps={{
              value: field.value,
              onChange: (e) => field.onChange(e.target.value),
            }}
            state={errors.secretaryId ? 'error' : 'default'}
            stateRelatedMessage={errors.secretaryId?.message}
          >
            <option value="" disabled>
              Sélectionner le secrétaire général
            </option>
            {secretaries.map((m) => (
              <option key={m.id} value={m.id}>
                {toFullName(m)}
              </option>
            ))}
          </Select>
        )}
      />

      <AbsentMemberSelector
        name="memberIds"
        sessionId={session.id}
        chairmanId={selectedChairmanId}
        // oxlint-disable-next-line typescript/no-explicit-any
        control={control as any}
      />

      <Controller
        name="justiceDepartmentContactId"
        control={control}
        render={({ field }) => (
          <JusticeContactSelector
            label={
              <FormattedMessage
                defaultMessage={`<mandatory>Représentant DSJ</mandatory>`}
                values={{ mandatory: (chunk) => <Mandatory>{chunk}</Mandatory> }}
              />
            }
            value={field.value}
            onChange={field.onChange}
          />
        )}
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
