import Accordion from '@codegouvfr/react-dsfr/Accordion';
import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';

import { NominationSessionAttachmentList } from '@/components/shared/NominationSessionAttachmentList';
import { useFindSessionDocsQuery } from '@queries/agenda.queries';
import { useListNominationSessionAttachmentsQuery } from '@queries/nomination-sessions.queries';

import * as importAttachments from './ImportAttachmentModal';
import { NominationSessionDocsList } from './NominationSessionDocsList';
import { TableauDeBordActionList } from './TableauDeBordActionsList';

export function TableauDeBordActions({ sessionId }: { sessionId: string }) {
  const { data: attachments } = useListNominationSessionAttachmentsQuery({ sessionId });
  const { data: docs } = useFindSessionDocsQuery({ sessionId });

  return (
    <div className="flex w-[30rem] flex-col">
      <Accordion
        titleAs="h2"
        label={
          <>
            Pièces jointes <Badge className="ml-1">{(attachments?.items ?? []).length}</Badge>
          </>
        }
      >
        {(attachments?.items ?? []).length === 0 && (
          <div className="text-center text-sm font-normal text-gray-600">Aucune pièce jointe.</div>
        )}

        <NominationSessionAttachmentList sessionId={sessionId} placeholder={null} />

        <div className="mt-2 text-center">
          <Button
            nativeButtonProps={importAttachments.modal.buttonProps}
            iconId="fr-icon-add-line"
            priority="tertiary no outline"
            className="mt-2"
            title="Importer des pièces jointes"
            size="small"
          >
            Ajouter
          </Button>
        </div>
      </Accordion>

      {(docs?.items ?? []).length > 0 && (
        <Accordion
          titleAs="h2"
          label={
            <>
              Documents <Badge className="ml-1">{(docs?.items ?? []).length}</Badge>
            </>
          }
        >
          {(docs?.items ?? []).length === 0 && (
            <div className="text-center text-sm font-normal text-gray-600">Aucune pièce jointe.</div>
          )}

          <NominationSessionDocsList sessionId={sessionId} />
        </Accordion>
      )}

      <TableauDeBordActionList className="mt-2" sessionId={sessionId} />
    </div>
  );
}
