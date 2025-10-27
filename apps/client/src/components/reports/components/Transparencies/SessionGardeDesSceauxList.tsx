import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { Tabs, type TabsProps } from '@codegouvfr/react-dsfr/Tabs';
import { Tag } from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';

import { Magistrat } from 'shared-models';

import type { SessionOfTypeGardeDesSceaux } from '../../../../react-query/queries/members/sessions.queries';
import { formationToLabel } from '../../labels/labels-mappers';
import { SessionBlock } from './SessionBlock';
import { getDetailSessionGdsPath } from '../../../../utils/route-path.utils';

export function SessionGardeDesSceauxList({ sessions }: { sessions: SessionOfTypeGardeDesSceaux[] }) {
  const sessionsByFormation = sessions.reduce(
    (byFormation, session) => {
      if (session.isAffected) {
        byFormation[session.formation].affected.push(session);
      } else {
        byFormation[session.formation].nonAffected.push(session);
      }

      byFormation[session.formation].length++;
      return byFormation;
    },
    {
      [Magistrat.Formation.PARQUET]: {
        length: 0,
        affected: [] as SessionOfTypeGardeDesSceaux[],
        nonAffected: [] as SessionOfTypeGardeDesSceaux[]
      },
      [Magistrat.Formation.SIEGE]: {
        length: 0,
        affected: [] as SessionOfTypeGardeDesSceaux[],
        nonAffected: [] as SessionOfTypeGardeDesSceaux[]
      }
    }
  );

  const tabs = [Magistrat.Formation.SIEGE, Magistrat.Formation.PARQUET]
    .filter((formation) => sessionsByFormation[formation].length > 0)
    .map((formation): TabsProps.Uncontrolled['tabs'][number] => ({
      label: formationToLabel(formation),
      content: (
        <>
          <h3>Vos dossiers</h3>
          {sessionsByFormation[formation].affected.length > 0 ? (
            <ul className={clsx('list-none gap-2', cx('fr-grid-row'))}>
              {sessionsByFormation[formation].affected.map((session) => (
                <li key={session.label}>
                  <Tag
                    linkProps={{
                      href: getDetailSessionGdsPath({ sessionId: session.id, focus: 'affectations' })
                    }}
                  >
                    {session.label}
                  </Tag>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">Aucun dossier ne vous est affecté pour le moment</p>
          )}

          {sessionsByFormation[formation].nonAffected.length > 0 ? (
            <>
              <h3>Tous les dossiers</h3>
              <ul className={clsx('list-none gap-2', cx('fr-grid-row'))}>
                {sessionsByFormation[formation].nonAffected.map((session) => (
                  <li key={session.label}>
                    {/* TODO: grey */}
                    <Tag
                      linkProps={{
                        href: getDetailSessionGdsPath({ sessionId: session.id, focus: 'general' })
                      }}
                    >
                      {session.label}
                    </Tag>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>Pas d'autre dossier disponible</p>
          )}
        </>
      )
    }));

  return (
    <SessionBlock
      hidden={sessions.length === 0}
      title="Pouvoir de proposition du GDS"
      noTransparenciesText="Il n'y a pas de transparences actives."
    >
      <Tabs tabs={tabs} style={{ height: 'auto' }} />
    </SessionBlock>
  );
}
