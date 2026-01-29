import Card from '@codegouvfr/react-dsfr/Card';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';

import { capitalize } from '@/utils/string.utils';
import type { DetailedReportDto } from '@api/types';
import clsx from 'clsx';
import { ReportVM } from '../../../../VM/ReportVM';
import { DateOnly } from '../../../../models/date-only.model';
import { getObservationDetailsPath } from '../../../../utils/route-path.utils';
import { reportHtmlIds } from '../../dom/html-ids';

export const Observers = ({
  observers,
  observations,
  sessionId,
  nominationFileId,
  reportId
}: Pick<ReportVM, 'observers'> & {
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
      className={clsx('rounded-lg bg-white', cx('fr-px-3w', 'fr-py-2w'))}
    >
      <h2>Observants</h2>

      {hasObservers && (
        <div
          aria-labelledby={reportHtmlIds.overview.observers}
          className={clsx('flex w-full flex-col gap-2 whitespace-pre-line')}
        >
          {observers.map(([observerName, ...observerInformation]) => (
            <div key={observerName} className={cx('fr-mb-2w')}>
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
          <h3 className={cx('fr-h6', 'fr-mt-3w', 'fr-mb-2w')}>Observations reçues</h3>
          <div className={clsx('grid grid-cols-1 gap-4 md:grid-cols-2')}>
            {observations.map((observation: NonNullable<DetailedReportDto['observations']>[number]) => {
              const magistratName = `${observation.magistrat.lastName.toUpperCase()} ${capitalize(observation.magistrat.firstName)}`;

              const observationPath = getObservationDetailsPath(
                {
                  sessionId,
                  nominationFileId,
                  observationId: observation.id
                },
                'membre'
              );
              const linkWithReport = reportId ? `${observationPath}?reportId=${reportId}` : observationPath;

              return (
                <Card
                  key={observation.id}
                  title={magistratName}
                  desc={
                    <div className={cx('fr-text--sm')}>
                      <p className={cx('fr-mb-0', 'fr-text--light')}>
                        Observation du {DateOnly.fromDateOnly(observation.dateReception)}
                      </p>
                    </div>
                  }
                  linkProps={{
                    to: linkWithReport
                  }}
                  enlargeLink
                  size="small"
                />
              );
            })}
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
