import { colors } from '@codegouvfr/react-dsfr';
import clsx from 'clsx';

import { DateOnly } from '../../../../../../models/date-only.model';
import type { DetailedNominationSession } from '../../../../../../react-query/mutations/sg/nomination-sessions';

const Label = ({ nom }: { nom: string }) => (
  <div style={{ color: colors.options.grey._625_425.default }}>{nom}</div>
);

export const TableauDeBordResumeDetails = (transparence: DetailedNominationSession) => {
  const { name, formation, date, dueDate, observationsClosingDate, positionStartDate } = transparence;

  return (
    <div className={clsx('grid grid-flow-row grid-cols-[max-content_1fr] gap-x-8 gap-y-4')}>
      <Label nom="Type de session" />
      <div>Transparence</div>

      <Label nom="Nom de la session" />
      <div>{name}</div>

      <Label nom="Formation" />
      <div>{formation}</div>

      <Label nom="Date de la session" />
      <div>{DateOnly.fromDateOnly(date)}</div>

      <Label nom="Clôture du délai d'observation" />
      <div>{DateOnly.fromDateOnly(observationsClosingDate)}</div>

      <Label nom="Date d'écheance" />
      <div>{dueDate && DateOnly.fromDateOnly(dueDate)}</div>

      <Label nom="Date de prise de poste" />
      <div>{positionStartDate && DateOnly.fromDateOnly(positionStartDate)}</div>
    </div>
  );
};
