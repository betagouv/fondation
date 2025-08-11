import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { type FC } from 'react';
import { parseTransparenceCompositeId } from '../../../models/transparence.model';
import { useParams } from 'react-router-dom';
import { TableauDeBordActions } from './tableau-de-bord/TableauDeBordActions';
import { TableauDeBordResume } from './tableau-de-bord/TableauDeBordResume';
import { useGetTransparence } from '../../../queries/sg/get-transparence.query';

export const Transparence: FC = () => {
  const { id } = useParams();
  const args = parseTransparenceCompositeId(id!);
  const {
    name,
    formation,
    date: { year, month, day }
  } = args;

  const {
    data: transparence,
    isPending,
    isError
  } = useGetTransparence({
    nom: name,
    formation,
    year,
    month,
    day
  });

  if (isPending) {
    return null;
  }

  if (!args || !transparence || isError) {
    return <div>Session de type Transparence non trouvée.</div>;
  }

  return (
    <div className={clsx(cx('fr-container'))}>
      <div className={clsx('gap-8', cx('fr-grid-row', 'fr-py-8v'))}>
        <TableauDeBordActions {...transparence} />
        <TableauDeBordResume {...transparence} />
      </div>
    </div>
  );
};

export default Transparence;
