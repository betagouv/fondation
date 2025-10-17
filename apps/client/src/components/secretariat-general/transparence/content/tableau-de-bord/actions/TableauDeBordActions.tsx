import Accordion from '@codegouvfr/react-dsfr/Accordion';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { ImportAttachmentModal } from './ImportAttachmentModal';
import { ImportObservantsModal } from './ImportObservantsModal';

import { type TransparenceSnapshot } from 'shared-models';
import { useGetTransparencyAttachmentsQuery } from '../../../../../../react-query/queries/get-transparency-attachments.query';

import { DateOnly } from '../../../../../../models/date-only.model';
import { useDeleteFile } from '../../../../../../react-query/mutations/delete-file.mutation';
import { AttachedFilesList } from './AttachedFilesList';
import Badge from '@codegouvfr/react-dsfr/Badge';

type TableauDeBordActionsProps = TransparenceSnapshot;

export const TableauDeBordActions = ({
  name,
  formation,
  dateTransparence,
  id
}: TableauDeBordActionsProps) => {
  const { data: attachments, refetch } = useGetTransparencyAttachmentsQuery(id);

  const { mutate: deleteFile } = useDeleteFile();

  const handleDeleteFile = (id: string) => {
    deleteFile(id, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  const dateTransparenceDateOnly = new DateOnly(
    dateTransparence.year,
    dateTransparence.month,
    dateTransparence.day
  );

  return (
    <div className={clsx('mt-4 flex flex-col justify-start gap-y-6', cx('fr-col-3', 'fr-text--bold'))}>
      <div>TABLEAU DE BORD</div>
      <div>
        <Accordion
          label={
            <span>
              Pièces jointes <Badge>{attachments?.length ?? 0}</Badge>
            </span>
          }
          titleAs="h2"
        >
          {!attachments || attachments.length === 0 ? (
            <div>Aucunes pièces jointes.</div>
          ) : (
            <AttachedFilesList attachedFiles={attachments} onAttachedFileDeleted={handleDeleteFile} />
          )}
        </Accordion>
        <Accordion label="Tableau initial" titleAs="h2">
          Tableau initial à venir.
        </Accordion>
        <Accordion label="Vérifier les règles automatisées" titleAs="h2">
          Vérifier les règles automatisées à venir.
        </Accordion>
      </div>

      <div className="flex flex-col gap-2">
        <ImportObservantsModal
          nomTransparence={name}
          formation={formation}
          dateTransparence={dateTransparenceDateOnly}
        />
        <ImportAttachmentModal
          sessionImportId={id}
          transparenceName={name}
          transparenceFormation={formation}
          transparenceDate={dateTransparenceDateOnly}
        />
      </div>
    </div>
  );
};
