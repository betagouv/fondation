import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { Tabs, type TabsProps } from '@codegouvfr/react-dsfr/Tabs';
import { Tag } from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';

import { FormationEnum, FormationEnumLabel } from '@/types/enums.types';
import { getDetailSessionGdsPath } from '@/utils/route-path.utils';
import type { SessionOfTypeGardeDesSceaux } from '@queries/members.queries';

import { SessionBlock } from './SessionBlock';

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
      [FormationEnum.PARQUET]: {
        length: 0,
        affected: [] as SessionOfTypeGardeDesSceaux[],
        nonAffected: [] as SessionOfTypeGardeDesSceaux[],
      },
      [FormationEnum.SIEGE]: {
        length: 0,
        affected: [] as SessionOfTypeGardeDesSceaux[],
        nonAffected: [] as SessionOfTypeGardeDesSceaux[],
      },
    },
  );

  const tabs = [FormationEnum.SIEGE, FormationEnum.PARQUET]
    .filter((formation) => sessionsByFormation[formation].length > 0)
    .map((formation): TabsProps.Uncontrolled['tabs'][number] => ({
      label: FormationEnumLabel[formation],
      content: (
        <div className="flex flex-col gap-6">
          <section>
            <h3>Vos sessions</h3>
            {sessionsByFormation[formation].affected.length > 0 ? (
              <ul className={clsx('list-none gap-2', cx('fr-grid-row'))}>
                {sessionsByFormation[formation].affected.map((session) => (
                  <li key={session.label}>
                    <Tag
                      linkProps={{
                        to: getDetailSessionGdsPath({ sessionId: session.id }),
                      }}
                    >
                      {session.label} - {session.fileCount}
                    </Tag>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fr-mb-0 text-sm">Aucune session en cours</p>
            )}
          </section>

          <section>
            <h3>Toutes les sessions</h3>
            {sessionsByFormation[formation].nonAffected.length > 0 ? (
              <ul className={clsx('list-none gap-2', cx('fr-grid-row'))}>
                {sessionsByFormation[formation].nonAffected.map((session) => (
                  <li key={session.label}>
                    {/* TODO: grey */}
                    <Tag
                      linkProps={{
                        to: getDetailSessionGdsPath({ sessionId: session.id }),
                      }}
                    >
                      {session.label}
                    </Tag>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Pas d'autre session disponible</p>
            )}
          </section>
        </div>
      ),
    }));

  return (
    <SessionBlock
      hidden={sessions.length === 0}
      title="Pouvoir de proposition du GDS"
      noTransparenciesText="Il n'y a pas de transparences actives."
    >
      {tabs.length > 1 ? <Tabs tabs={tabs} style={{ height: 'auto' }} /> : tabs[0]?.content}
    </SessionBlock>
  );
}
