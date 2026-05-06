import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import z from 'zod';

import { useOfficialReport } from '../context/OfficialReportContext';
import { Mandatory } from '@/components/shared/Mandatory';
import { DateOnly } from '@/models/date-only.model';
import { toFullName } from '@/utils/user.utils';
import {
  useListAgendasForNewOfficialReportQuery,
  useListMembersForNewOfficialReportQuery,
  useListSecretariesGeneralQuery,
} from '@queries/agenda.queries';

import { JusticeContactSelector } from './JusticeContactSelector';

const OfficialReportMetadataSchema = z.object({
  sessionMeetingDate: DateOnly.codec(),
  sessionMeetingTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  hasRenunciation: z.boolean(),
  justiceDepartmentContactId: z.string().nonempty('Veuillez sélectionner un représentant DSJ'),
  chairmanId: z.uuid('Veuillez sélectionner un président'),
  secretaryId: z.uuid('Veuillez sélectionner un secrétaire'),
  memberIds: z.array(z.uuid()).nonempty('Veuillez sélectionner au moins un membre'),
  agendaId: z.string().nonempty('Veuillez sélectionner un ordre du jour'),
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
      sessionMeetingDate: metadata?.sessionMeetingDate
        ? DateOnly.fromStoreModel(metadata.sessionMeetingDate).toFormattedString('yyyy-MM-dd')
        : new Date().toISOString().split('T')[0]!,
      sessionMeetingTime: metadata?.sessionMeetingTime ?? '',
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
    getValues,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: 'all',
    defaultValues,
    resolver: zodResolver(OfficialReportMetadataSchema),
  });

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

  const memberIdsInitialized = React.useRef(false);
  React.useEffect(() => {
    if (members.length > 0 && !memberIdsInitialized.current) {
      memberIdsInitialized.current = true;
      if (!metadata?.memberIds.length) {
        setValue(
          'memberIds',
          members.map((m) => m.id),
        );
      }
    }
  }, [members, metadata, setValue]);

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

  const onMemberChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const currentMemberIds = getValues('memberIds');
      if (event.target.checked) {
        setValue('memberIds', currentMemberIds.concat(event.target.value));
      } else {
        setValue(
          'memberIds',
          currentMemberIds.filter((x) => x !== event.target.value),
        );
      }
    },
    [getValues, setValue],
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
                  defaultMessage={`{name} - ODJ du {date, date, short}`}
                  values={{
                    date: DateOnly.fromStoreModel(agenda.date).toDate(),
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
        name="sessionMeetingTime"
        control={control}
        render={({ field }) => (
          <Input
            label={
              <FormattedMessage
                defaultMessage={`<mandatory>Heure de la séance</mandatory>`}
                values={{ mandatory: (chunk) => <Mandatory>{chunk}</Mandatory> }}
              />
            }
            nativeInputProps={{ type: 'time', ...field }}
            state={errors.sessionMeetingTime ? 'error' : 'default'}
            stateRelatedMessage={errors.sessionMeetingTime?.message}
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

      <Controller
        name="memberIds"
        control={control}
        render={({ field }) => (
          <Checkbox
            legend={
              <FormattedMessage
                defaultMessage={`<mandatory>Membres présents</mandatory>`}
                values={{ mandatory: (chunk) => <Mandatory>{chunk}</Mandatory> }}
              />
            }
            classes={{ content: 'grid grid-cols-3 gap-x-4 items-start', inputGroup: `first:!mt-0` }}
            options={members.map((member) => ({
              label: toFullName(member),
              nativeInputProps: {
                ...field,
                value: member.id,
                onChange: onMemberChange,
                checked: field.value.includes(member.id),
              },
            }))}
            state={errors.memberIds && 'error'}
            stateRelatedMessage={errors.memberIds?.message}
          />
        )}
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
