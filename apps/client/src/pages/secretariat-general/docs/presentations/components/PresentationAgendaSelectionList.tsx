import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { usePresentationPlan } from '../contexts/presentation-plan.context';
import { useSelection } from '@/hooks/useSelection.hook';
import { FormationEnumLabel, TypeDeSaisineEnum } from '@/types/enums.types';
import { dateOnlyToDate } from '@/utils/date-only.util';
import { normalizeSessionName } from '@/utils/session.utils';
import { toInitials } from '@/utils/user.utils';

export function PresentationAgendaSelectionList(props: {
  formation: 'PARQUET' | 'SIEGE';
  items:
    | readonly {
        id: string;
        formation: 'SIEGE' | 'PARQUET';
        session: { name: string; typeDeSaisine: TypeDeSaisineEnum };
        chairman: { firstName: string; lastName: string };
        date: { day: number; month: number; year: number };
        sessionMeetingDate: { day: number; month: number; year: number };
      }[]
    | undefined;
}) {
  const { formatMessage } = useIntl();
  const { formation, items } = props;

  const formationItems = React.useMemo(
    () => (items ?? []).filter((item) => item.formation === formation),
    [items, formation],
  );

  const formationLabel = React.useMemo(() => FormationEnumLabel[formation], [formation]);
  const viewItems = React.useMemo(
    () =>
      formationItems
        .map(({ id, sessionMeetingDate, chairman, session }) => ({
          id,
          date: dateOnlyToDate(sessionMeetingDate),
          label: formatMessage(
            { defaultMessage: `ODJ {sessionMeetingDate, date, short} {sessionName} - {initials}` },
            {
              sessionMeetingDate: dateOnlyToDate(sessionMeetingDate),
              initials: toInitials(chairman),
              sessionName: normalizeSessionName(session),
            },
          ),
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [formationItems, formatMessage],
  );

  const selection = useSelection({
    items: viewItems,
    defaultSelection: [],
    toString: ({ id }) => id,
  });
  const onCheckboxChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      selection.toggle(event.target.value, event.target.checked);
    },
    [selection],
  );

  const [isNavigating, setIsNavigating] = React.useState<boolean>(false);
  const { initPlanCreation } = usePresentationPlan();
  const onInitPlanCreate = React.useCallback(() => {
    if (selection.size === 0 || isNavigating) return;

    setIsNavigating(true);
    initPlanCreation({ agendaIds: selection.list(), formation });
  }, [selection, formation, isNavigating, setIsNavigating, initPlanCreation]);

  return (
    <>
      <h3 className="fr-h5 flex items-start justify-between lowercase">
        <span>{formationLabel}</span>
        <Button
          className="fr-ml-12v"
          size="small"
          disabled={selection.size === 0 || isNavigating}
          iconId={selection.size > 0 ? 'fr-icon-add-line' : undefined}
          onClick={onInitPlanCreate}
        >
          <FormattedMessage
            values={{ count: selection.size }}
            defaultMessage={`{count, plural,
              one {Créer une notice}
              other {Créer une notice\u00A0({count})}
            }`}
          />
        </Button>
      </h3>

      <Checkbox
        small
        options={viewItems.map((item) => ({
          label: item.label,
          nativeInputProps: {
            value: item.id,
            checked: selection.has(item),
            onChange: onCheckboxChange,
          },
        }))}
      />
    </>
  );
}
