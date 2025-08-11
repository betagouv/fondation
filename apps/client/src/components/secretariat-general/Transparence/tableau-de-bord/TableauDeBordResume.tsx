import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import type { TransparenceSnapshot } from 'shared-models';
import { colors } from '@codegouvfr/react-dsfr';
import { DateOnly } from '../../../../models/date-only.model';

export type TableauDeBordResumeProps = TransparenceSnapshot;

const Label = ({ nom }: { nom: string }) => (
  <div style={{ color: colors.options.grey._625_425.default }}>{nom}</div>
);

export const TableauDeBordResume = ({
  name,
  formation,
  dateTransparence,
  dateClotureDelaiObservation,
  datePriseDePosteCible,
  dateEcheance
}: TableauDeBordResumeProps) => {
  return (
    <div className={clsx('border-2 border-solid', cx('fr-px-12v', 'fr-py-8v', 'fr-col'))}>
      <h1>Gérer une session</h1>

      <div className={clsx('grid grid-flow-row grid-cols-[max-content_1fr] gap-x-8 gap-y-4')}>
        <Label nom="Type de session" />
        <div>Transparence</div>

        <Label nom="Nom de la session" />
        <div>{name}</div>

        <Label nom="Formation" />
        <div>{formation}</div>

        <Label nom="Date de la session" />
        <div>
          {new DateOnly(
            dateTransparence.year,
            dateTransparence.month,
            dateTransparence.day
          ).toFormattedString('dd/MM/yyyy')}
        </div>

        <Label nom="Clôture du délai d'observation" />
        <div>
          {new DateOnly(
            dateClotureDelaiObservation.year,
            dateClotureDelaiObservation.month,
            dateClotureDelaiObservation.day
          ).toFormattedString('dd/MM/yyyy')}
        </div>

        <Label nom="Date d'écheance" />
        <div>
          {dateEcheance &&
            new DateOnly(dateEcheance.year, dateEcheance.month, dateEcheance.day).toFormattedString(
              'dd/MM/yyyy'
            )}
        </div>

        <Label nom="Date de prise de poste" />
        <div>
          {datePriseDePosteCible &&
            new DateOnly(
              datePriseDePosteCible.year,
              datePriseDePosteCible.month,
              datePriseDePosteCible.day
            ).toFormattedString('dd/MM/yyyy')}
        </div>
      </div>
    </div>
  );
};
