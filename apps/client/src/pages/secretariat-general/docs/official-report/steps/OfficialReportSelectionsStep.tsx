import ButtonsGroup from '@codegouvfr/react-dsfr/ButtonsGroup';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import clsx from 'clsx';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { DateOnly } from '@/models/date-only.model';
import { useListAgendasForNewOfficialReportQuery } from '@queries/agenda.queries';

import { FormationEnumLabel } from '@/types/enums.types';
import { useSelection } from '../../agenda/hooks/useSelection.hook';
import { useOfficialReport } from '../context/OfficialReportContext';

export function OfficialReportSelectionsStep(props: { className?: string }) {
  const { session, isSubmitting, submit, goToMetadata } = useOfficialReport();

  const { data: agendasData } = useListAgendasForNewOfficialReportQuery({ sessionId: session.id });
  const agendas = React.useMemo(() => agendasData?.items ?? [], [agendasData]);

  const agendaSelection = useSelection({ items: agendas, toString: ({ id }) => id });

  const onAgendaChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      agendaSelection.toggle(e.target.value, e.target.checked);
    },
    [agendaSelection]
  );

  const onSubmit = React.useCallback(() => {
    if (agendaSelection.hasNone) return;
    submit(agendaSelection.list());
  }, [submit, agendaSelection]);

  return (
    <div className={clsx('mx-auto max-w-2xl', props.className)}>
      {agendas.length === 0 ? (
        <p className="text-center text-gray-500">
          <FormattedMessage defaultMessage="Aucun ordre du jour disponible" />
        </p>
      ) : (
        <Checkbox
          legend={
            <FormattedMessage
              values={{ count: agendaSelection.size }}
              defaultMessage={`{count, plural,
                =0 {Aucun ordre du jour sélectionné}
                one {1 ordre du jour sélectionné}
                other {{count, number} ordres du jour sélectionnés}}`}
            />
          }
          options={agendas.map((agenda) => ({
            label: [
              DateOnly.fromStoreModel(agenda.date).toFormattedString('dd/MM/yyyy'),
              FormationEnumLabel[agenda.formation]
            ].join(' — '),
            nativeInputProps: {
              value: agenda.id,
              checked: agendaSelection.has(agenda),
              onChange: onAgendaChange
            }
          }))}
        />
      )}

      <ButtonsGroup
        className="mt-6"
        inlineLayoutWhen="md and up"
        alignment="center"
        buttons={[
          { children: 'Retour', priority: 'secondary', onClick: goToMetadata, type: 'button' },
          {
            type: 'button',
            onClick: onSubmit,
            disabled: agendaSelection.hasNone || isSubmitting,
            className: clsx({ 'before:animate-spin': isSubmitting }),
            iconId: agendaSelection.hasNone
              ? undefined
              : isSubmitting
                ? 'ri-loader-4-line'
                : 'ri-file-pdf-2-line',
            children: (
              <FormattedMessage
                values={{ count: agendaSelection.size }}
                defaultMessage={`{count, plural,
                  =0 {En attente de sélection}
                  one {Générer le PV avec 1 ordre du jour}
                  other {Générer le PV avec {count, number} ordres du jour}}`}
              />
            )
          }
        ]}
      />
    </div>
  );
}
