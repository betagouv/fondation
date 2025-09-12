import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { type FC } from 'react';
import { useParams } from 'react-router-dom';

import { useGetTransparence } from '../../../../react-query/queries/sg/get-transparence.query';
import { TableauDeBordActions } from './tableau-de-bord/actions/TableauDeBordActions';
import { TableauDeBordResume } from './tableau-de-bord/resume/TableauDeBordResume';

export const Transparence: FC = () => {
  const { id } = useParams();

  const {
    data: transparence,
    isPending,
    isError
  } = useGetTransparence({
    sessionId: id as string
  });

  if (isPending) {
    return null;
  }

  if (!id || !transparence || isError) {
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
