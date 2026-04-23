import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { DateOnly } from '@/models/date-only.model';
import { FormationEnumLabel } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { timeOnlyToDate } from '@/utils/time-only.util';
import Tag from '@codegouvfr/react-dsfr/Tag';
import { useListNonPresentedPlansQuery, useListPresentationPlansAgendasQuery } from '@queries/agenda.queries';
import { PresentationAgendaSelectionList } from './components/PresentationAgendaSelecionList';

export function PresentationsTabReady() {
  const { $t } = useIntl();
  const { data: plans, isFetching: isFetchingPlans } = useListNonPresentedPlansQuery();
  const { data: agendas, isFetching: isFetchingAgendas } = useListPresentationPlansAgendasQuery();

  const isFetching = isFetchingPlans || isFetchingAgendas;

  const planItems = (plans?.items ?? []).map((item) => {
    const formation = FormationEnumLabel[item.formation];
    const date = DateOnly.fromStoreModel(item.date).toDate();
    const time = timeOnlyToDate(item.time);

    return { id: item.id, formation, date, time };
  });

  if (isFetching) {
    return (
      <div className="fr-container">
        <p
          className={clsx(
            'text-md text-center text-gray-600 before:animate-spin before:content-[""]',
            cx('ri-loader-4-line')
          )}
        >
          <FormattedMessage defaultMessage="Chargement..." />
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-10">
      {planItems.length > 0 && (
        <div>
          <h2 className={clsx('uppercase', cx('fr-h4'))}>
            <FormattedMessage defaultMessage="Notices" />
          </h2>

          <ul className="m-0 list-none p-0">
            {planItems.map((item) => (
              <li key={item.id} className="flex items-center">
                <Button size="small" priority="tertiary no outline" iconId="ri-file-pdf-2-line">
                  <FormattedMessage
                    values={item}
                    defaultMessage="Notice de restitution {formation} du {date, date, short}, {time, time, short}"
                  />
                </Button>

                <div className="actions ml-10 flex items-center gap-x-2">
                  <Tag
                    small
                    as="button"
                    title={$t({ defaultMessage: 'Marquer restitué' })}
                    className="!bg-[var(--background-contrast-yellow-moutarde)] font-bold uppercase !text-[color:var(--text-action-high-yellow-moutarde)] hover:!bg-[var(--background-contrast-yellow-moutarde-hover)] active:!bg-[var(--background-contrast-yellow-moutarde-active)]"
                    nativeButtonProps={{
                      onClick() {
                        console.log('restituée');
                      }
                    }}
                  >
                    Restituer
                  </Tag>

                  <Button
                    title={$t({ defaultMessage: `Éditer` })}
                    size="small"
                    className="rounded-full"
                    priority="tertiary no outline"
                    iconId="fr-icon-edit-fill"
                    linkProps={{ to: generatePath(ROUTE_PATHS.SG.PRESENTATIONS_UPDATE, { planId: item.id }) }}
                  />

                  <Button
                    title={$t({ defaultMessage: `Supprimer` })}
                    size="small"
                    className="rounded-full hover:text-red-500"
                    priority="tertiary no outline"
                    iconId="fr-icon-delete-bin-fill"
                    linkProps={{ to: generatePath(ROUTE_PATHS.SG.PRESENTATIONS_UPDATE, { planId: item.id }) }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(agendas?.items ?? []).length > 0 && (
        <div>
          <h2 className="fr-h4 uppercase">
            <FormattedMessage defaultMessage="Ordres du jour" />
          </h2>

          <div className="flex gap-x-20">
            <section>
              <PresentationAgendaSelectionList formation={'SIEGE'} items={agendas?.items} />
            </section>

            <section>
              <PresentationAgendaSelectionList formation={'PARQUET'} items={agendas?.items} />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
