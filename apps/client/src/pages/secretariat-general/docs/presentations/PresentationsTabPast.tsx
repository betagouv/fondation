import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { dateOnlyToDate } from '@/utils/date-only.util';
import { timeOnlyToDate } from '@/utils/time-only.util';
import { toInitials } from '@/utils/user.utils';
import {
  useListPresentedPlansQuery,
  useOpenJusticePresentationPlanPdfDocumentMutation,
} from '@queries/agenda.queries';

export function PresentationsTabPast() {
  const { data: pastPresentations, isSuccess } = useListPresentedPlansQuery();

  const openPresentationPdf = useOpenJusticePresentationPlanPdfDocumentMutation();

  const viewItems = (pastPresentations?.items ?? []).map((item) => ({
    id: item.id,
    date: dateOnlyToDate(item.date),
    time: timeOnlyToDate(item.time),
    formation: item.formation === 'SIEGE' ? 'siège' : 'parquet',
    initials: toInitials(item.chairman),
  }));

  const onOpenPdf = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const { planId } = e.currentTarget.dataset;
      if (!planId) return;

      return openPresentationPdf.mutate({ planId });
    },
    [openPresentationPdf],
  );

  return (
    <>
      <h2 className="fr-h4 uppercase">
        <FormattedMessage defaultMessage="Restitutions passées" />
      </h2>
      {isSuccess && pastPresentations?.items.length === 0 && (
        <p className="text-md fr-ml-2v text-gray-600 italic">
          <FormattedMessage defaultMessage="aucune restitution passée" />
        </p>
      )}

      {viewItems.length > 0 && (
        <ul className="fr-m-0 fr-p-0 list-none">
          {viewItems.map((item) => (
            <li className="fr-m-0 fr-p-0" key={item.id}>
              <Button
                size="small"
                priority="tertiary no outline"
                nativeButtonProps={{ 'data-plan-id': item.id, onClick: onOpenPdf }}
                iconId="ri-file-pdf-2-line"
                disabled={openPresentationPdf.isPending}
              >
                <FormattedMessage
                  values={item}
                  defaultMessage={`NDR {date, date, dateOnlyShort}, {time, time, short} - {initials} - {formation}`}
                />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
