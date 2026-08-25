import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath } from 'react-router';

import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/shared/ui/menu';
import { getNewAgendaPath, ROUTE_PATHS } from '@/utils/route-path.utils';
import { useIsSessionReadyForDocGenerationQuery } from '@queries/agenda.queries';

export function DocGenerationMenu(props: { sessionId: string }) {
  const { data: readiness } = useIsSessionReadyForDocGenerationQuery({
    sessionId: props.sessionId,
  });

  const officialReportPath = useMemo(
    () =>
      generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_NEW, {
        sessionId: props.sessionId,
      }),
    [props.sessionId],
  );

  const canCreateAgenda = !!readiness?.canCreateAgenda;
  const canCreateOfficialReport = !!readiness?.canCreateOfficialReport;

  return (
    <MenuRoot>
      <MenuTrigger className="py-2!" iconId="fr-icon-folder-2-line" priority="primary" size="small">
        <FormattedMessage defaultMessage="Générer la documentation" />
        <i aria-hidden className="fr-icon-arrow-down-s-line fr-icon--sm fr-ml-1v" />
      </MenuTrigger>

      <MenuContent>
        {canCreateAgenda ? (
          <MenuItem iconId="ri-calendar-line" linkProps={{ to: getNewAgendaPath(props.sessionId) }}>
            <FormattedMessage defaultMessage="Ordre du jour" />
          </MenuItem>
        ) : (
          <MenuItem disabled iconId="ri-calendar-line">
            <span className="flex flex-col items-start text-left">
              <FormattedMessage defaultMessage="Ordre du jour" />
              <span className="text-xs font-normal text-(--text-mention-grey)">
                <FormattedMessage defaultMessage="Aucun dossier n'est disponible" />
              </span>
            </span>
          </MenuItem>
        )}

        {canCreateOfficialReport ? (
          <MenuItem iconId="ri-file-text-line" linkProps={{ to: officialReportPath }}>
            <FormattedMessage defaultMessage="Procès verbal" />
          </MenuItem>
        ) : (
          <MenuItem disabled iconId="ri-file-text-line">
            <span className="flex flex-col items-start text-left">
              <FormattedMessage defaultMessage="Procès verbal" />
              <span className="text-xs font-normal text-(--text-mention-grey)">
                <FormattedMessage defaultMessage="Chaque dossier de l'ODJ doit avoir une issue et un rapporteur publié" />
              </span>
            </span>
          </MenuItem>
        )}
      </MenuContent>
    </MenuRoot>
  );
}
