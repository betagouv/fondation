import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';

import { useSelectedFileIds } from '../contexts/files-selection.context';
import { useNominationFilesTable } from '../contexts/files-table.context';
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/components/shared/menu';
import { useAgendaBasket } from '@/pages/secretariat-general/docs/agenda/hooks/useAgendaBasket.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useIsSessionReadyForDocGenerationQuery } from '@queries/agenda.queries';

export function AgendaBasketButton() {
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

  if (basket.isEmpty) {
    return (
      <Button
        size="small"
        priority="secondary"
        iconId="fr-icon-file-add-line"
        onClick={onAddToBasket}
        disabled={selectedIds.length === 0}
      >
        <FormattedMessage defaultMessage={"Ajouter à l'ODJ"} />
      </Button>
    );
  }

  return (
    <MenuRoot>
      <MenuTrigger size="small" priority="secondary" iconId="fr-icon-folder-2-line">
        ODJ ({basket.size}) <i className={cx('ri-arrow-down-s-line')} />
      </MenuTrigger>

      <MenuContent>
        <MenuItem onClick={onAddToBasket} disabled={selectedIds.length === 0} iconId="fr-icon-file-add-line">
          <FormattedMessage
            values={{ count: basket.size }}
            defaultMessage={`{count, plural,
              =0 {Ajouter à l'ODJ}
              other {Ajouter à l'ODJ ({count})}
            }`}
          />
        </MenuItem>

        <MenuItem onClick={onStartAgenda}>
          <FormattedMessage defaultMessage={"Générer l'ODJ"} />
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
