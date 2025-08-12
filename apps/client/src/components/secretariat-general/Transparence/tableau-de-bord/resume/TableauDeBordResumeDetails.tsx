import clsx from 'clsx';
import type { TransparenceSnapshot } from 'shared-models';
import { DateOnly } from '../../../../../models/date-only.model';
import { colors } from '@codegouvfr/react-dsfr';

const Label = ({ nom }: { nom: string }) => (
  <div style={{ color: colors.options.grey._625_425.default }}>{nom}</div>
);

type TableauDeBordResumeDetailsProps = TransparenceSnapshot;
export const TableauDeBordResumeDetails = (transparence: TableauDeBordResumeDetailsProps) => {
  const {
    name,
    formation,
    dateTransparence,
    dateClotureDelaiObservation,
    dateEcheance,
    datePriseDePosteCible
  } = transparence;

  return (
    <div className={clsx('grid grid-flow-row grid-cols-[max-content_1fr] gap-x-8 gap-y-4')}>
      <Label nom="Type de session" />
      <div>Transparence</div>

      <Label nom="Nom de la session" />
      <div>{name}</div>

      <Label nom="Formation" />
      <div>{formation}</div>

      <Label nom="Date de la session" />
      <div>{DateOnly.fromDateOnly(dateTransparence)}</div>

      <Label nom="Clôture du délai d'observation" />
      <div>{DateOnly.fromDateOnly(dateClotureDelaiObservation)}</div>

      <Label nom="Date d'écheance" />
      <div>{dateEcheance && DateOnly.fromDateOnly(dateEcheance)}</div>

      <Label nom="Date de prise de poste" />
      <div>{datePriseDePosteCible && DateOnly.fromDateOnly(datePriseDePosteCible)}</div>
    </div>
  );
};
