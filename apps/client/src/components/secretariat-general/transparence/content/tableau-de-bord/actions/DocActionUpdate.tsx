import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { FoundSessionDocsDto } from '@api/types';
import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { generatePath, useNavigate } from 'react-router';

export function DocActionUpdate(props: {
  sessionId: string;
  doc: FoundSessionDocsDto['items'][number];
  setIsActing: (isActing: boolean) => void;
  disabled: boolean;
}) {
  const { sessionId, doc, disabled, setIsActing } = props;

  const confirmation = useConfirmation();
  const navigate = useNavigate();

  const linkProps = React.useMemo(() => {
    if (doc.type === 'agenda') {
      if (doc.isLinkedToOfficialReport) return undefined;

      return { to: generatePath(ROUTE_PATHS.SG.AGENDA_UPDATE, { sessionId, agendaId: doc.id }) };
    }

    return {
      to: generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_UPDATE, { sessionId, officialReportId: doc.id })
    };
  }, [sessionId, doc]);

  const confirmUpdate = React.useCallback(async () => {
    setIsActing(true);
    try {
      const { isConfirmed } = await confirmation.waitForConfirmation({
        title: `Modification d'un ordre du jour`,
        content: (
          <p>
            En modifiant cet ordre du jour,{' '}
            <strong className="font-bold">vous allez supprimer son PV lié</strong>. Êtes-vous sûr de vouloir
            continuer ?
          </p>
        ),
        i18n: { confirm: `Oui, et supprimer le PV lié` }
      });

      if (isConfirmed) {
        await navigate(generatePath(ROUTE_PATHS.SG.AGENDA_UPDATE, { sessionId, agendaId: doc.id }));
      }
    } finally {
      setIsActing(false);
    }
  }, [confirmation, sessionId, doc, navigate, setIsActing]);

  return (
    <Button
      size="small"
      iconId="fr-icon-edit-fill"
      priority="tertiary no outline"
      className="rounded-full"
      title={`Modifier"{doc.name}"`}
      disabled={disabled}
      linkProps={linkProps as never}
      onClick={doc.type === 'agenda' && doc.isLinkedToOfficialReport ? confirmUpdate : undefined}
      nativeButtonProps={
        doc.type === 'agenda' && doc.isLinkedToOfficialReport ? confirmation.buttonProps : undefined
      }
    />
  );
}
