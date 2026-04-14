import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';

import { DateOnly } from '@/models/date-only.model';
import { toFullName } from '@/utils/user.utils';
import {
  useListMembersForNewOfficialReportQuery,
  useListSecretariesForNewOfficialReportQuery
} from '@queries/agenda.queries';

import { Mandatory } from '@/components/shared/Mandatory';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { FormattedMessage } from 'react-intl';
import { useOfficialReport } from '../context/OfficialReportContext';

const OfficialReportMetadataSchema = z.object({
  sessionMeetingDate: DateOnly.codec(),
  sessionMeetingTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  hasRenunciation: z.boolean(),
  justiceDepartmentContactId: z.coerce.number().int().gt(0, 'Valeur invalide'),
  chairmanId: z.uuid('Veuillez sélectionner un président'),
  secretaryId: z.uuid('Veuillez sélectionner un secrétaire'),
  memberIds: z.array(z.uuid()).nonempty('Veuillez sélectionner au moins un membre')
});

export function OfficialReportMetadataStep(props: { className?: string }) {
  const { session, metadata, goToSelections, cancel } = useOfficialReport();

  const { data: membersData } = useListMembersForNewOfficialReportQuery({ sessionId: session.id });
  const { data: secretariesData } = useListSecretariesForNewOfficialReportQuery({ sessionId: session.id });

  const secretaries = React.useMemo(() => secretariesData?.items ?? [], [secretariesData]);
  const members = React.useMemo(() => membersData?.items ?? [], [membersData]);
  const chairmen = React.useMemo(
    () =>
      members.filter((m) =>
        m.duty === 'PRESIDENT' && session.formation === 'PARQUET'
          ? m.title === 'DEPUTY_PRESIDENT_PARQUET' || m.title === 'PRESIDENT_PARQUET'
          : m.title === 'DEPUTY_PRESIDENT_SIEGE' || m.title === 'PRESIDENT_SIEGE'
      ),
    [members, session]
  );

  const defaultValues = React.useMemo(
    () => ({
      sessionMeetingDate: metadata?.sessionMeetingDate
        ? DateOnly.fromStoreModel(metadata.sessionMeetingDate).toFormattedString('yyyy-MM-dd')
        : new Date().toISOString().split('T')[0]!,
      sessionMeetingTime: metadata?.sessionMeetingTime ?? '',
      hasRenunciation: metadata?.hasRenunciation ?? false,
      justiceDepartmentContactId: metadata?.justiceDepartmentContactId ?? ('' as unknown as number),
      chairmanId: metadata?.chairmanId ?? '',
      secretaryId: metadata?.secretaryId ?? '',
      memberIds: metadata?.memberIds ?? ([] as string[])
    }),
    [metadata]
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    resolver: zodResolver(OfficialReportMetadataSchema),
    defaultValues
  });

  React.useEffect(() => {
    if (chairmen.length > 0 && !metadata?.chairmanId) {
      const president = chairmen.find((c) =>
        session.formation === 'PARQUET' ? c.title === 'PRESIDENT_PARQUET' : c.title === 'PRESIDENT_SIEGE'
      );
      if (president) setValue('chairmanId', president.id);
    }
  }, [chairmen, session.formation, metadata, setValue]);

  React.useEffect(() => {
    if (members.length > 0 && !metadata?.secretaryId) {
      const secretary = members.find((m) => m.title === 'FIRST_SECRETARY');
      if (secretary) setValue('secretaryId', secretary.id);
    }
  }, [members, metadata, setValue]);

  const memberIdsInitialized = React.useRef(false);
  React.useEffect(() => {
    if (members.length > 0 && !memberIdsInitialized.current) {
      memberIdsInitialized.current = true;
      if (!metadata?.memberIds.length) {
        setValue(
          'memberIds',
          members.map((m) => m.id)
        );
      }
    }
  }, [members, metadata, setValue]);

  return (
    <form onSubmit={handleSubmit(goToSelections)} className={clsx('mx-auto max-w-2xl', props.className)}>
      <Controller
        name="sessionMeetingDate"
        control={control}
        render={({ field }) => (
          <Input
            label={
              <FormattedMessage
                defaultMessage={`Date de la séance`}
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
                defaultMessage={`Heure de la séance`}
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
            nativeSelectProps={{ value: field.value, onChange: (e) => field.onChange(e.target.value) }}
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
            nativeSelectProps={{ value: field.value, onChange: (e) => field.onChange(e.target.value) }}
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
            className="grid grid-cols-3 gap-x-4"
            legend={
              <FormattedMessage
                defaultMessage={`<mandatory>Membres présents</mandatory>`}
                values={{ mandatory: (chunk) => <Mandatory>{chunk}</Mandatory> }}
              />
            }
            options={members.map((member) => ({
              label: toFullName(member),
              nativeInputProps: { ...field, checked: field.value.includes(member.id), value: member.id }
            }))}
            state={errors.memberIds && 'error'}
            stateRelatedMessage={errors.memberIds?.message}
          />
        )}
      />

      <Controller
        name="justiceDepartmentContactId"
        control={control}
        render={() => (
          <Input
            label={
              <FormattedMessage
                defaultMessage={`<mandatory>Contact Justice</mandatory>`}
                values={{ mandatory: (chunk) => <Mandatory>{chunk}</Mandatory> }}
              />
            }
            // nativeInputProps={{ type: 'number', min: 1, ...field }}
            state={errors.justiceDepartmentContactId ? 'error' : 'default'}
            stateRelatedMessage={errors.justiceDepartmentContactId?.message}
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
        alignment="right"
        inlineLayoutWhen="md and up"
        buttons={[
          { children: 'Annuler', priority: 'secondary', onClick: cancel, type: 'button' },
          { children: 'Sélectionner les ordres du jour', type: 'submit', disabled: !isValid }
        ]}
      />
    </form>
  );
}
