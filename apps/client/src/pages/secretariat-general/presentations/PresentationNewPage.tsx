import { Accordion } from '@codegouvfr/react-dsfr/Accordion';
import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import Stepper from '@codegouvfr/react-dsfr/Stepper';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import z from 'zod';

import { Mandatory } from '@/components/shared/Mandatory';
import { DateOnly } from '@/models/date-only.model';
import { FormationEnumLabel } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { capitalize } from '@/utils/string.utils';
import { toFullName } from '@/utils/user.utils';
import {
  useListPresentationPlansAgendasQuery,
  useListSecretariesForNewOfficialReportQuery,
  useSearchChairmenQuery
} from '@queries/agenda.queries';
import { JusticeContactSelector } from '../docs/official-report/components/JusticeContactSelector';
import { usePresentationPlan } from './contexts/presentation-plan.context';

const MetadataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  chairmanId: z.uuid('Veuillez sélectionner un président'),
  secretaryId: z.uuid('Veuillez sélectionner un secrétaire'),
  justiceContactId: z.string().min(1, 'Veuillez sélectionner un contact DSJ')
});

function MetadataStep(props: { className?: string }) {
  const { state, setMetadata, isDisabled } = usePresentationPlan();
  const navigate = useNavigate();

  const { data: chairmenData, isFetching: isFetchingChairmen } = useSearchChairmenQuery({
    formation: state.formation ?? undefined
  });
  const { data: secretariesData, isFetching: isFetchingSecretaries } =
    useListSecretariesForNewOfficialReportQuery();

  const chairmen = chairmenData?.items ?? [];
  const secretaries = secretariesData?.items ?? [];

  const defaultDate = state.date
    ? DateOnly.fromStoreModel(state.date).toFormattedString('yyyy-MM-dd')
    : new Date().toISOString().split('T')[0]!;
  const defaultTime = state.time
    ? `${String(state.time.hours).padStart(2, '0')}:${String(state.time.minutes).padStart(2, '0')}`
    : '';

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    resolver: zodResolver(MetadataSchema),
    defaultValues: {
      date: defaultDate,
      time: defaultTime,
      chairmanId: state.chairmanId ?? '',
      secretaryId: state.secretaryId ?? '',
      justiceContactId: state.justiceContactId ?? ''
    }
  });

  React.useEffect(() => {
    const selectedChairman = getValues('chairmanId');
    if (selectedChairman || !chairmenData?.items.length) return;

    setValue('chairmanId', chairmenData.items[0].id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  }, [chairmenData, getValues, setValue]);

  React.useEffect(() => {
    const selectedSecretary = getValues('secretaryId');
    if (selectedSecretary || !secretariesData?.items.length) return;

    setValue('secretaryId', secretariesData.items[0].id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  }, [secretariesData, getValues, setValue]);

  React.useEffect(() => {
    if (!Object.keys(state.agendas).length) {
      navigate(ROUTE_PATHS.SG.PRESENTATIONS_READY);
    }
  }, [state, navigate]);

  const onSubmit = handleSubmit((values) => {
    const [year, month, day] = values.date.split('-').map(Number) as [number, number, number];
    const [hours, minutes] = values.time.split(':').map(Number) as [number, number];

    setMetadata({
      chairmanId: values.chairmanId,
      secretaryId: values.secretaryId,
      justiceContactId: values.justiceContactId,
      date: { year, month, day },
      time: { hours, minutes }
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

      <Controller
        name="chairmanId"
        control={control}
        render={({ field }) => (
          <Select
            disabled={isDisabled || isFetchingChairmen}
            label={<Mandatory>Président de séance</Mandatory>}
            nativeSelectProps={{ value: field.value, onChange: (e) => field.onChange(e.target.value) }}
            state={errors.chairmanId ? 'error' : 'default'}
            stateRelatedMessage={errors.chairmanId?.message}
          >
            <option value="" disabled>
              Sélectionner le président
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
            disabled={isDisabled || isFetchingSecretaries}
            label={<Mandatory>Secrétaire Général</Mandatory>}
            nativeSelectProps={{ value: field.value, onChange: (e) => field.onChange(e.target.value) }}
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

      <Controller
        name="justiceContactId"
        control={control}
        render={({ field }) => (
          <JusticeContactSelector
            label={<Mandatory>Représentant DSJ</Mandatory>}
            value={field.value || null}
            onChange={(value) => field.onChange(value ?? '')}
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
            type: 'button'
          },
          {
            type: 'submit',
            children: 'Suivant',
            disabled: !isValid || isDisabled
          }
        ]}
      />
    </form>
  );
}

function AgendaCommentsStep(props: { className?: string }) {
  const { state, createPlan, isDisabled, planId, goToMetadata } = usePresentationPlan();

  const { data: agendasData } = useListPresentationPlansAgendasQuery({ ignorePlanId: planId ?? undefined });

  const agendaIds = Object.keys(state.agendas);
  const agendas = React.useMemo(
    () => (agendasData?.items ?? []).filter(({ id }) => agendaIds.includes(id)),
    [agendasData, agendaIds]
  );

  const [comments, setComments] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(agendaIds.map((id) => [id, state.agendas[id] ?? '']))
  );

  const onCommentChange = React.useCallback((id: string, value: string) => {
    setComments((prev) => ({ ...prev, [id]: value }));
  }, []);

  const onSubmit = React.useCallback(() => {
    createPlan({
      agendas: Object.fromEntries(
        Object.entries(comments).map(([id, comment]) => [id, comment.trim() || null])
      )
    });
  }, [comments, createPlan]);

  return (
    <div className={clsx('mx-auto max-w-2xl', props.className)}>
      {agendas.map((agenda, i) => (
        <Accordion
          key={agenda.id}
          defaultExpanded={i === 0}
          label={[
            `Ordre du jour du ${DateOnly.fromStoreModel(agenda.date).toFormattedString('dd/MM/yyyy')}`,
            capitalize(FormationEnumLabel[agenda.formation])
          ].join(' — ')}
        >
          <Input
            label="Commentaire"
            textArea
            nativeTextAreaProps={{
              rows: 4,
              value: comments[agenda.id] ?? '',
              onChange: (e) => onCommentChange(agenda.id, e.target.value)
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
            disabled: isDisabled
          }
        ]}
      />
    </div>
  );
}

const STEPS = {
  METADATA: { title: 'Métadonnées de la notice' },
  AGENDA_COMMENTS: { title: 'Commentaires sur les ordres du jour' }
} as const;

export function PresentationNewPage() {
  const { state } = usePresentationPlan();

  const step = STEPS[state.step];
  const stepIndex = state.step === 'METADATA' ? 1 : 2;
  const nextTitle = state.step === 'METADATA' ? STEPS.AGENDA_COMMENTS.title : undefined;

  return (
    <div className="fr-container fr-py-2w">
      <Stepper stepCount={2} currentStep={stepIndex} title={step.title} nextTitle={nextTitle} />
      <MetadataStep className={clsx({ hidden: state.step !== 'METADATA' })} />
      <AgendaCommentsStep className={clsx({ hidden: state.step !== 'AGENDA_COMMENTS' })} />
    </div>
  );
}
