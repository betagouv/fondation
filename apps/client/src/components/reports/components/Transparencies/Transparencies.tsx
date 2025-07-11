import { colors } from '@codegouvfr/react-dsfr';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { CsmTransparencies } from './CsmTransparencies';
import { GdsTransparencies } from './GdsTransparencies';
import { useValidateSessionFromCookie } from '../../../../queries/validate-session-from-cookie.query';
import { useListReports } from '../../../../queries/list-reports.queries';
import { formatTransparencies } from '../../../../utils/format-transparencies.utils';

export const Transparencies = () => {
  const { user } = useValidateSessionFromCookie();
  const { data: reportsData, isPending: isReportsLoading } = useListReports();

  const reports = reportsData?.data || [];
  const transparencies = formatTransparencies(reports);
  const gdsTransparencies = transparencies['GARDE DES SCEAUX'];

  const civility = user?.civility;

  if (isReportsLoading) {
    return null;
  }

  return (
    <div className={clsx('gap-10', cx('fr-grid-row'))}>
      <div>
        <h1>
          Bonjour,&nbsp;
          <span
            style={{
              color: colors.options.yellowTournesol.sun407moon922.hover
            }}
          >
            {civility}
          </span>
          .
        </h1>

        <p
          style={{
            display: transparencies.noTransparencies ? 'none' : undefined
          }}
          className={cx('fr-text--xl')}
        >
          Sur quel type de saisine souhaitez-vous travailler ?
        </p>
      </div>

      <div className="flex w-full justify-center">
        <div
          className={clsx(
            'flex-row gap-10 md:flex-nowrap md:gap-20 lg:gap-40',
            cx('fr-grid-row')
          )}
        >
          <GdsTransparencies gdsTransparencies={gdsTransparencies} />
          <CsmTransparencies />
        </div>
      </div>
    </div>
  );
};

export default Transparencies;
