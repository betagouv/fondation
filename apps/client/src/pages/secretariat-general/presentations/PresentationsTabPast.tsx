import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import { DateOnly } from '@/models/date-only.model';
import { timeOnlyToDate } from '@/utils/time-only.util';
import {
  useListPresentedPlansQuery,
  useOpenJusticePresentationPlanPdfDocumentMutation,
} from '@queries/agenda.queries';

export function PresentationsTabPast() {
  const { data: pastPresentations, isSuccess } = useListPresentedPlansQuery();

  const openPresentationPdf = useOpenJusticePresentationPlanPdfDocumentMutation();

  const viewItems = (pastPresentations?.items ?? []).map((item) => ({
    id: item.id,
    date: DateOnly.fromStoreModel(item.date).toDate(),
    time: timeOnlyToDate(item.time),
    formation: item.formation === 'SIEGE' ? 'siège' : 'parquet',
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
        <p className="text-md ml-2 italic text-gray-600">
          <FormattedMessage defaultMessage="aucune restitution passée" />
        </p>
      )}

      {viewItems.length > 0 && (
        <ul className="m-0 list-none p-0">
          {viewItems.map((item) => (
            <li className="m-0 p-0" key={item.id}>
              <Button
                size="small"
                priority="tertiary no outline"
                nativeButtonProps={{ 'data-plan-id': item.id, onClick: onOpenPdf }}
                iconId="ri-file-pdf-2-line"
                disabled={openPresentationPdf.isPending}
              >
                <FormattedMessage
                  values={item}
                  defaultMessage={`Notice de restitution {formation} du {date, date, short}, {time, time, short}`}
                />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
