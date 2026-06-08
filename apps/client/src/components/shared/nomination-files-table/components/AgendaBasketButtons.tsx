import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';

import { useSelectedFileIds } from '../contexts/files-selection.context';
import { useNominationFilesTable } from '../contexts/files-table.context';
import { useAgendaBasket } from '@/pages/secretariat-general/docs/agenda/hooks/useAgendaBasket.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useIsSessionReadyForDocGenerationQuery } from '@queries/agenda.queries';

export function AgendaBasketButtons() {
  const navigate = useNavigate();
  const { sessionId } = useNominationFilesTable();
  const selectedIds = useSelectedFileIds();
  const basket = useAgendaBasket(sessionId);
  const { data: readiness } = useIsSessionReadyForDocGenerationQuery({ sessionId });

  const onAddToBasket = React.useCallback(() => {
    if (selectedIds.length === 0) return;
    basket.add(selectedIds);
  }, [basket, selectedIds]);

  const onStartAgenda = React.useCallback(() => {
    navigate(generatePath(ROUTE_PATHS.SG.AGENDA_NEW, { sessionId }));
  }, [navigate, sessionId]);

  if (!readiness?.canCreateAgenda) return null;

  return (
    <>
      <Button
        size="small"
        priority="secondary"
        iconId="fr-icon-file-add-line"
        onClick={onAddToBasket}
        className="grow"
        disabled={selectedIds.length === 0}
      >
        <FormattedMessage defaultMessage={"Ajouter à l'ODJ"} />
      </Button>
      <Button size="small" onClick={onStartAgenda} disabled={basket.isEmpty} className="grow">
        <FormattedMessage
          values={{ count: basket.size }}
          defaultMessage={`{count, plural,
            =0 {Générer l'ODJ}
            other {Générer l'ODJ ({count, number})}
          }`}
        />
      </Button>
    </>
  );
}
