import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';

import { ObservationCard } from '@/features/observations/components/ObservationCard';
import { reportHtmlIds } from '@/features/reports/constants/html-ids.constants';
import type { DetailedReportDto } from '@api/types';

export const Observers = ({
  observers,
  observations,
  sessionId,
  nominationFileId,
  reportId,
}: {
  observers: string[];
  observations?: DetailedReportDto['observations'];
  sessionId?: string;
  nominationFileId?: string;
  reportId?: string;
}) => {
  const hasLegacyObservers = observers.length > 0;
  const hasObservations = observations && observations.length > 0 && sessionId && nominationFileId;

  // Ne rien afficher si ni observateurs ni observations
  if (!hasLegacyObservers && !hasObservations) return null;

  return (
    <section
      id={reportHtmlIds.overview.observersSection}
      className={clsx('rounded-lg bg-(--background-default-grey)', cx('fr-px-6v', 'fr-py-4v'))}
    >
      <h2>Observant(s)</h2>

      {hasLegacyObservers && (
        <div
          aria-labelledby={reportHtmlIds.overview.observers}
          className={clsx('flex w-full flex-col gap-2 whitespace-pre-line')}
        >
          {observers.map((o) => {
            const [observerName, ...observerInformations] = o.split(/\n/);
            return (
              <div key={observerName} className={clsx(cx('fr-mb-4v'))}>
                <div className={cx('fr-mb-1v')}>
                  <span className="fr-text--bold">{observerName}</span>
                  <span className={cx('fr-ml-1v')}>(via LODAM)</span>
                </div>
                {observerInformations.map((info) => (
                  <div key={info}>{info}</div>
                ))}
              </div>
            );
          })}
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
