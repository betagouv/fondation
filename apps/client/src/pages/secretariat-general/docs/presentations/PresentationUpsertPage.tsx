import { Accordion } from '@codegouvfr/react-dsfr/Accordion';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import Stepper from '@codegouvfr/react-dsfr/Stepper';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { format } from 'date-fns';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';
import z from 'zod';

import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { Mandatory } from '@/components/shared/Mandatory';
import { dateOnlyToDate } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { toFullName } from '@/utils/user.utils';
import {
  useDetailsAgendaMetadataQuery,
  useListPresentationPlansAgendasQuery,
  useListSecretariesGeneralQuery,
} from '@queries/agenda.queries';
import { AbsentMemberSelector } from '../components/AbsentMemberSelector';
import { ChairmanSelector } from '../components/ChairmanSelector';
import { JusticeContactSelector } from '../components/JusticeContactSelector';

import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import { usePresentationPlan } from './contexts/presentation-plan.context';

const MetadataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  chairmanId: z.uuid('Veuillez sélectionner un président'),
  secretaryId: z.uuid('Veuillez sélectionner un secrétaire'),
  justiceContactId: z.string().min(1, 'Veuillez sélectionner un contact DSJ'),
  memberIds: z.array(z.string()),
  hasRenunciation: z.boolean(),
});

function MetadataStep(props: { className?: string }) {
  const { state, setMetadata, isDisabled } = usePresentationPlan();
  const navigate = useNavigate();

  const { data: secretariesData, isFetching: isFetchingSecretaries } = useListSecretariesGeneralQuery();
  const { data: agenda } = useDetailsAgendaMetadataQuery({ agendaId: Object.keys(state.agendas)[0] });

  const secretaries = secretariesData?.items ?? [];

  const defaultDate = format(dateOnlyToDate(state.date) ?? new Date(), 'yyyy-MM-dd');
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

  React.useEffect(() => {
    const selectedSecretary = getValues('secretaryId');
    if (selectedSecretary || !secretariesData?.items.length) return;

    setValues((form) => ({ ...form, secretaryId: secretariesData.items[0].id }), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }, [secretariesData, getValues, setValues]);

  React.useEffect(() => {
    if (!Object.keys(state.agendas).length) {
      navigate(ROUTE_PATHS.SG.PRESENTATIONS_READY);
    }
  }, [state.agendas, navigate]);

  React.useEffect(() => {
    const shouldDefineDate = !dirtyFields.date && agenda?.sessionMeetingDate;
    const shouldDefineChairman = !dirtyFields.chairmanId && agenda?.chairmanId;

    if (!shouldDefineChairman && !shouldDefineDate) {
      return;
    }

    setValues(
      (form) => ({
        ...form,
        chairmanId: agenda?.chairmanId ?? form.chairmanId,
        date: agenda?.sessionMeetingDate
          ? dateOnlyToDate(agenda.sessionMeetingDate).toISOString().split('T')[0]
          : form.date,
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
            label={<Mandatory>Date de la séance</Mandatory>}
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
            label={<Mandatory>Heure de la séance</Mandatory>}
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
            label={<Mandatory>Secrétaire Général</Mandatory>}
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
                {toFullName(s)}
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
          <Mandatory>
            <FormattedMessage defaultMessage="Représentant DSJ" />
          </Mandatory>
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
        className="mt-6"
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

function AgendaCommentsStep(props: { className?: string }) {
  const { state, createPlan, isDisabled, planId, goToMetadata } = usePresentationPlan();

  const { data: agendasData } = useListPresentationPlansAgendasQuery({
    ignorePlanId: planId ?? undefined,
  });

  const agendaIds = Object.keys(state.agendas);
  const agendas = React.useMemo(
    () => (agendasData?.items ?? []).filter(({ id }) => agendaIds.includes(id)),
    [agendasData, agendaIds],
  );

  const uniqueAgendas = React.useMemo(() => {
    const seenSessions = new Set<string>();
    return agendas.filter(({ session }) => {
      if (seenSessions.has(session.id)) return false;
      seenSessions.add(session.id);
      return true;
    });
  }, [agendas]);

  const [comments, setComments] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(agendaIds.map((id) => [id, state.agendas[id] ?? ''])),
  );

  const onCommentChange = React.useCallback((agendaId: string, value: string) => {
    setComments((prev) => ({ ...prev, [agendaId]: value }));
  }, []);

  const onSubmit = React.useCallback(() => {
    createPlan({
      agendas: Object.fromEntries(
        Object.entries(comments).map(([id, comment]) => [id, comment.trim() || null]),
      ),
    });
  }, [comments, createPlan]);

  return (
    <div className={clsx('mx-auto max-w-2xl', props.className)}>
      {uniqueAgendas.map((agenda, i) => (
        <Accordion key={agenda.id} defaultExpanded={i === 0} label={agenda.session.name}>
          <Input
            label="Commentaire"
            textArea
            nativeTextAreaProps={{
              rows: 4,
              value: comments[agenda.id] ?? '',
              style: { fieldSizing: 'content' },
              onChange: (e) => onCommentChange(agenda.id, e.target.value),
            }}
          />
        </Accordion>
      ))}

      <ButtonsGroup
        className="mt-6"
        alignment="right"
        inlineLayoutWhen="md and up"
        buttons={[
          { children: 'Retour', priority: 'secondary', onClick: goToMetadata, type: 'button' },
          {
            children: 'Créer la notice',
            type: 'button',
            onClick: onSubmit,
            disabled: isDisabled,
          },
        ]}
      />
    </div>
  );
}

function PresentationBreadcrumb() {
  const { planId } = usePresentationPlan();
  const { formatMessage } = useIntl();
  return (
    <Breadcrumb
      ariaLabel="Fil d'Ariane"
      id="restitutions_breadcrumb"
      breadcrumb={{
        currentPageLabel: planId
          ? formatMessage({ defaultMessage: `Notice de restitution` })
          : formatMessage({ defaultMessage: 'Nouvelle notice de restitution' }),
        segments: [
          { label: 'Secrétariat Général', to: generatePath(ROUTE_PATHS.SG.DASHBOARD) },
          { label: 'Restitutions', to: generatePath(ROUTE_PATHS.SG.PRESENTATIONS_READY) },
        ],
      }}
    />
  );
}

const STEPS = {
  METADATA: { title: 'Métadonnées de la notice' },
  AGENDA_COMMENTS: { title: 'Commentaires sur les ordres du jour' },
} as const;

export function PresentationUpsertPage() {
  const { state } = usePresentationPlan();

  const step = STEPS[state.step];
  const stepIndex = state.step === 'METADATA' ? 1 : 2;
  const nextTitle = state.step === 'METADATA' ? STEPS.AGENDA_COMMENTS.title : undefined;

  return (
    <div className="fr-container fr-py-2w">
      <PresentationBreadcrumb />

      <Stepper stepCount={2} currentStep={stepIndex} title={step.title} nextTitle={nextTitle} />
      <MetadataStep className={clsx({ hidden: state.step !== 'METADATA' })} />
      <AgendaCommentsStep className={clsx({ hidden: state.step !== 'AGENDA_COMMENTS' })} />
    </div>
  );
}
