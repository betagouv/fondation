import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { Card } from './Card';

import clsx from 'clsx';
import { reportHtmlIds } from '../../dom/html-ids';
import { ReportVM } from '../../../../VM/ReportVM';

export const Observers = ({ observers }: Pick<ReportVM, 'observers'>) => {
  if (!observers) return null;

  return (
    <Card id={reportHtmlIds.overview.observersSection}>
      <h2 id={reportHtmlIds.overview.observers}>{ReportVM.observersLabel}</h2>
      <div
        aria-labelledby={reportHtmlIds.overview.observers}
        className={clsx('flex w-full flex-col gap-4 whitespace-pre-line leading-10')}
      >
        {observers.map(([observerName, ...observerInformation]) => (
          <div key={observerName}>
            <div key={observerName} className={cx('fr-text--bold')}>
              {observerName}
            </div>
            <ObserverInformation observerInformation={observerInformation} />
          </div>
        ))}
      </div>
    </Card>
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
