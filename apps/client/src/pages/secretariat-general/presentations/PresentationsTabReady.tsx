import { DateOnly } from '@/models/date-only.model';
import { FormationEnumLabel } from '@/types/enums.types';
import { timeOnlyToDate } from '@/utils/time-only.util';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useListNonPresentedPlansQuery, useListPresentationPlansAgendasQuery } from '@queries/agenda.queries';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';
import { PresentationAgendaSelectionList } from './components/PresentationAgendaSelecionList';

export function PresentationsTabReady() {
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
    <>
      {planItems.length > 0 && (
        <>
          <h2 className={clsx('uppercase', cx('fr-h4'))}>
            <FormattedMessage defaultMessage="Notices" />
          </h2>

          <ul className="m-0 list-none p-0">
            {planItems.map((item) => (
              <li key={item.id}>
                <FormattedMessage
                  values={item}
                  defaultMessage="Notice {formation} du {date, date, short}, {time, time, short}"
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {(agendas?.items ?? []).length > 0 && (
        <>
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
        </>
      )}
    </>
  );
}
