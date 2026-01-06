import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';

import { useUser } from '@queries/auth.queries';
import { useListMemberGdsSessions } from '@queries/members.queries';

import { SessionCsmList } from './SessionCsmList';
import { SessionGardeDesSceauxList } from './SessionGardeDesSceauxList';

const Sessions = () => {
  const { user } = useUser();
  const { data: sessionsList, isPending: areSessionsPending } = useListMemberGdsSessions({
    userId: user?.id
  });

  const civility = user?.civility;
  if (areSessionsPending) {
    return null;
  }

  return (
    <div className={clsx('gap-10', cx('fr-grid-row'))}>
      <div>
        <h1>
          Bonjour,&nbsp;
          <span style={{ color: colors.options.yellowTournesol.sun407moon922.hover }}>{civility}</span>.
        </h1>

        <p
          style={{ display: sessionsList?.items.length === 0 ? 'none' : undefined }}
          className={cx('fr-text--xl')}
        >
          Sur quel type de saisine souhaitez-vous travailler ?
        </p>
      </div>

      <div className="flex w-full justify-center">
        <div className={clsx('flex-row gap-10 md:flex-nowrap md:gap-20 lg:gap-40', cx('fr-grid-row'))}>
          <SessionGardeDesSceauxList sessions={sessionsList?.items ?? []} />
          <SessionCsmList />
        </div>
      </div>
    </div>
  );
};

export default Sessions;
