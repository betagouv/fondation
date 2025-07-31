import Accordion from '@codegouvfr/react-dsfr/Accordion';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { ImportObservantsModal } from '../ImportObservantsModal';
import { ImportAttachmentModal } from '../ImportAttachmentModal';
import { DateOnly } from '../../../../models/date-only.model';
import { Magistrat } from 'shared-models';
import { useGetTransparencyAttachmentsQuery } from '../../../../queries/get-transparency-attachments.query';

type TableauDeBordActionsProps = {
  transparenceName: string;
  transparenceFormation: Magistrat.Formation;
  transparenceDate: DateOnly;
  transparenceSessionImportId: string;
};

export const TableauDeBordActions = ({
  transparenceName,
  transparenceFormation,
  transparenceDate,
  transparenceSessionImportId
}: TableauDeBordActionsProps) => {
  const { data: attachments } = useGetTransparencyAttachmentsQuery(
    transparenceSessionImportId
  );

  // Pouvoir les supprimer, livrer en PREPROD avec le job
  console.log('TODO afficher les pièces jointes', attachments);

  return (
    <div
      className={clsx(
        'mt-4 flex flex-col justify-start gap-y-6',
        cx('fr-col-3', 'fr-text--bold')
      )}
    >
      <div>TABLEAU DE BORD</div>
      <div>
        <Accordion label="Pièces jointes" titleAs="h2">
          <div>Aucunes pièces jointes.</div>
        </Accordion>
        <Accordion label="Tableau initial" titleAs="h2">
          Tableau initial à venir.
        </Accordion>
        <Accordion label="Vérifier les règles automatisés" titleAs="h2">
          Vérifier les règles automatisées à venir.
        </Accordion>
      </div>

      <ImportObservantsModal
        nomTransparence={transparenceName}
        formation={transparenceFormation}
        dateTransparence={transparenceDate}
      />
      <ImportAttachmentModal
        sessionImportId={transparenceSessionImportId}
        transparenceName={transparenceName}
        transparenceFormation={transparenceFormation}
        transparenceDate={transparenceDate}
      />
    </div>
  );
};
