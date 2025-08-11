import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { DateOnly } from '../../../../models/date-only.model';
import type { Magistrat } from 'shared-models';
import { colors } from '@codegouvfr/react-dsfr';

export type TableauDeBordResumeProps = {
  transparenceName: string;
  transparenceFormation: Magistrat.Formation;
  transparenceDate: DateOnly;
  transparenceClosingDate: DateOnly;
  transparenceSessionImportId: string;
};

const Label = ({ nom }: { nom: string }) => (
  <div style={{ color: colors.options.grey._625_425.default }}>{nom}</div>
);

export const TableauDeBordResume = ({
  transparenceName,
  transparenceFormation,
  transparenceDate,
  transparenceClosingDate
}: TableauDeBordResumeProps) => {
  return (
    <div className={clsx('border-2 border-solid', cx('fr-px-12v', 'fr-py-8v', 'fr-col'))}>
      <h1>Gérer une session</h1>

      <div className={clsx('grid grid-flow-row grid-cols-[max-content_1fr] gap-x-8 gap-y-4')}>
        <Label nom="Type de session" />
        <div>Transparence</div>

        <Label nom="Nom de la session" />
        <div>{transparenceName}</div>

        <Label nom="Formation" />
        <div>{transparenceFormation}</div>

        <Label nom="Date de la session" />
        <div>{transparenceDate.toFormattedString('dd/MM/yyyy')}</div>

        <Label nom="Clôture du délai d'observation" />
        <div>{transparenceClosingDate.toFormattedString('dd/MM/yyyy')}</div>

        <Label nom="Date d'écheance" />
        <div>{transparenceClosingDate.toFormattedString('dd/MM/yyyy')}</div>

        <Label nom="Date de prise de poste" />
        <div>{transparenceClosingDate.toFormattedString('dd/MM/yyyy')}</div>
      </div>
    </div>
  );
};
