import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router';
import z from 'zod';

import { AbsentMemberSelector } from '@/features/documents/components/AbsentMemberSelector';
import { ChairmanSelector } from '@/features/documents/components/ChairmanSelector';
import { JusticeContactSelector } from '@/features/documents/components/JusticeContactSelector';
import { usePresentationPlan } from '@/features/documents/context/presentation-plan.context';
import { RequiredLabel } from '@/shared/ui/required-label';
import { dateOnlyToIso } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { memberFullName } from '@/utils/user.utils';
import { useDetailsAgendaMetadataQuery, useListSecretariesGeneralQuery } from '@queries/agenda.queries';

const MetadataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  chairmanId: z.uuid('Veuillez sélectionner un président'),
  secretaryId: z.uuid('Veuillez sélectionner un secrétaire'),
  justiceContactId: z.string().min(1, 'Veuillez sélectionner un contact DSJ'),
  memberIds: z.array(z.string()),
  hasRenunciation: z.boolean(),
});

export function PresentationMetadataStep(props: { className?: string }) {
  const { state, setMetadata, isDisabled } = usePresentationPlan();
  const navigate = useNavigate();

  const { data: secretariesData, isFetching: isFetchingSecretaries } = useListSecretariesGeneralQuery();
  const { data: agenda } = useDetailsAgendaMetadataQuery({ agendaId: Object.keys(state.agendas)[0] });

  const secretaries = secretariesData?.items ?? [];

  const defaultDate = dateOnlyToIso(state.date) ?? format(new Date(), 'yyyy-MM-dd');
  const defaultTime = state.time
    ? `${String(state.time.hours).padStart(2, '0')}:${String(state.time.minutes).padStart(2, '0')}`
    : '';

  const {
    control,
    handleSubmit,
    getValues,
    setValues,
    formState: { errors, isValid, dirtyFields },
  } = useForm({
    mode: 'all',
    resolver: zodResolver(MetadataSchema),
    defaultValues: {
      date: defaultDate,
      time: defaultTime,
      chairmanId: state.chairmanId ?? '',
      secretaryId: state.secretaryId ?? '',
      justiceContactId: state.justiceContactId ?? '',
      memberIds: state.absentMemberIds,
      hasRenunciation: state.hasRenunciation,
    },
  });

  useEffect(() => {
    const selectedSecretary = getValues('secretaryId');
    if (selectedSecretary || !secretariesData?.items.length) return;

    setValues((form) => ({ ...form, secretaryId: secretariesData.items[0].id }), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [secretariesData, getValues, setValues]);

  useEffect(() => {
    if (!Object.keys(state.agendas).length) {
      navigate(ROUTE_PATHS.SG.PRESENTATIONS_READY);
    }
  }, [state.agendas, navigate]);

  useEffect(() => {
    const shouldDefineDate = !dirtyFields.date && agenda?.sessionMeetingDate;
    const shouldDefineChairman = !dirtyFields.chairmanId && agenda?.chairmanId;

    if (!shouldDefineChairman && !shouldDefineDate) {
      return;
    }

    setValues(
      (form) => ({
        ...form,
        chairmanId: agenda?.chairmanId ?? form.chairmanId,
        date: agenda?.sessionMeetingDate ? dateOnlyToIso(agenda.sessionMeetingDate) : form.date,
      }),
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
  }, [dirtyFields, agenda, setValues]);

  const onSubmit = handleSubmit((values) => {
    const [year, month, day] = values.date.split('-').map(Number) as [number, number, number];
    const [hours, minutes] = values.time.split(':').map(Number) as [number, number];

    setMetadata({
      chairmanId: values.chairmanId,
      secretaryId: values.secretaryId,
      justiceContactId: values.justiceContactId,
      date: { year, month, day },
      time: { hours, minutes },
      absentMemberIds: values.memberIds,
      hasRenunciation: values.hasRenunciation,
    });
  });

  return (
    <form onSubmit={onSubmit} className={clsx('mx-auto max-w-2xl', props.className)}>
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <Input
            disabled={isDisabled}
            label={<RequiredLabel>Date de la séance</RequiredLabel>}
            nativeInputProps={{ type: 'date', ...field }}
            state={errors.date ? 'error' : 'default'}
            stateRelatedMessage={errors.date?.message}
          />
        )}
      />
      <Controller
        name="time"
        control={control}
        render={({ field }) => (
          <Input
            label={<RequiredLabel>Heure de la séance</RequiredLabel>}
            nativeInputProps={{ type: 'time', ...field }}
            disabled={isDisabled}
            state={errors.time ? 'error' : 'default'}
            stateRelatedMessage={errors.time?.message}
          />
        )}
      />

      <ChairmanSelector
        formation={state.formation ?? undefined}
        // oxlint-disable-next-line typescript/no-explicit-any
        control={control as any}
        name="chairmanId"
      />

      <Controller
        name="secretaryId"
        control={control}
        render={({ field }) => (
          <Select
            disabled={isDisabled || isFetchingSecretaries}
            label={<RequiredLabel>Secrétaire Général</RequiredLabel>}
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
            {secretaries.map((s) => (
              <option key={s.id} value={s.id}>
                {memberFullName(s)}
              </option>
            ))}
          </Select>
        )}
      />

      <AbsentMemberSelector
        formation={state.formation}
        // oxlint-disable-next-line typescript/no-explicit-any
        control={control as any}
        name="memberIds"
      />

      <JusticeContactSelector
        label={
          <RequiredLabel>
            <FormattedMessage defaultMessage="Représentant DSJ" />
          </RequiredLabel>
        }
        // oxlint-disable-next-line typescript/no-explicit-any
        control={control as any}
        name="justiceContactId"
      />

      <Controller
        control={control}
        name="hasRenunciation"
        render={({ field }) => (
          <ToggleSwitch
            label={
              <FormattedMessage defaultMessage="Renonciation du ministère au délai de convocation de huit jours" />
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
          {
            children: 'Annuler',
            priority: 'secondary',
            onClick: () => navigate(ROUTE_PATHS.SG.PRESENTATIONS_READY),
            type: 'button',
          },
          {
            type: 'submit',
            children: 'Suivant',
            disabled: !isValid || isDisabled,
          },
        ]}
      />
    </form>
  );
}
