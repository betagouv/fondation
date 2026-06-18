import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';

import { reportHtmlIds } from '../../dom/html-ids';
import { ObservationCard } from '@/components/shared/observations';
import type { DetailedReportDto } from '@api/types';

export const Observers = ({
  observers,
  observations,
  sessionId,
  nominationFileId,
  reportId,
}: {
  observers: string[] | null;
  observations?: DetailedReportDto['observations'];
  sessionId?: string;
  nominationFileId?: string;
  reportId?: string;
}) => {
  const hasObservers = observers && observers.length > 0;
  const hasObservations = observations && observations.length > 0 && sessionId && nominationFileId;

  // Ne rien afficher si ni observateurs ni observations
  if (!hasObservers && !hasObservations) return null;

  return (
    <section
      id={reportHtmlIds.overview.observersSection}
      className={clsx('rounded-lg bg-(--background-default-grey)', cx('fr-px-6v', 'fr-py-4v'))}
    >
      <h2>Observant(s)</h2>

      {hasObservers && (
        <div
          aria-labelledby={reportHtmlIds.overview.observers}
          className={clsx('flex w-full flex-col gap-2 whitespace-pre-line')}
        >
          {observers.map(([observerName, ...observerInformation]) => (
            <div key={observerName} className={cx('fr-mb-4v')}>
              <div key={observerName} className={cx('fr-text--bold', 'fr-mb-1v')}>
                {observerName}
              </div>
              <ObserverInformation observerInformation={observerInformation} />
            </div>
          ))}
        </div>
      )}

      {hasObservations && (
        <>
          <h3 className={cx('fr-h6', 'fr-mt-6v', 'fr-mb-4v')}>Observations reçues</h3>
          <div className={clsx('grid grid-cols-2 gap-4')}>
            {observations.map((observation: NonNullable<DetailedReportDto['observations']>[number]) => (
              <ObservationCard
                key={observation.id}
                observation={observation}
                sessionId={sessionId!}
                nominationFileId={nominationFileId!}
                context="membre"
                reportId={reportId}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

const ObserverInformation = ({ observerInformation }: { observerInformation: string[] }) => {
  return (
    <div aria-labelledby="observers" className="w-full whitespace-pre-line">
      {observerInformation.map((info) => (
        <div key={info}>{info}</div>
      ))}
    </div>
  );
};
