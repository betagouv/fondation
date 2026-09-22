import Badge from '@codegouvfr/react-dsfr/Badge';
import { useCallback, type MouseEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  PresentationAuthoring,
  PresentationRestitution,
} from '@/features/documents/components/presentations/PresentationAuthoring';
import { FormationEnumMessages } from '@/shared/enums/formation.enum';
import { LinkButton } from '@/shared/ui/link-button';
import { formatDateOnly } from '@/utils/date-only.util';
import { timeOnlyToDate, timeOnlyToString, toFrenchHours, type PlainTimeOnly } from '@/utils/time-only.util';
import { toInitials } from '@/utils/user.utils';
import {
  useListPresentedPlansQuery,
  useOpenJusticePresentationPlanPdfDocumentMutation,
} from '@queries/agenda.queries';

function inFrenchHours(time: PlainTimeOnly) {
  const hoursAndMinutes = timeOnlyToString(time, 'HH:mm');
  return hoursAndMinutes ? toFrenchHours(hoursAndMinutes) : null;
}

export function PresentationPresentedList() {
  const { formatMessage } = useIntl();
  const { data: pastPresentations, isSuccess } = useListPresentedPlansQuery();

  const openPresentationPdf = useOpenJusticePresentationPlanPdfDocumentMutation();

  const viewItems = (pastPresentations?.items ?? []).map((item) => ({
    authoring: {
      createdAt: item.createdAt,
      createdBy: item.createdBy,
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy,
    },
    date: formatDateOnly(item.date),
    formation: formatMessage(FormationEnumMessages[item.formation]),
    hasPdf: item.status === 'VALIDATED',
    id: item.id,
    initials: toInitials(item.chairman),
    meeting: {
      end: item.endTime ? inFrenchHours(item.endTime) : null,
      start: inFrenchHours(item.time),
    },
    outdated: item.outdated,
    restitution: {
      presentedAt: item.presentedAt,
      presentedBy: item.presentedBy,
    },
    time: timeOnlyToDate(item.time),
  }));

  const onOpenPdf = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const { planId } = e.currentTarget.dataset;
      if (!planId) return;

      return openPresentationPdf.mutate({ planId });
    },
    [openPresentationPdf],
  );

  if (isSuccess && viewItems.length === 0) {
    return (
      <p className="text-md fr-ml-2v text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Aucune notice n'a encore été restituée." />
      </p>
    );
  }

  return (
    <ul className="fr-m-0 fr-p-0 list-none">
      {viewItems.map(({ authoring, hasPdf, meeting, outdated, restitution, ...item }) => {
        const name = formatMessage(
          { defaultMessage: 'NDR {date}, {time, time, short} - {initials}' },
          { date: item.date, initials: item.initials, time: item.time },
        );

        return (
          <li
            className="fr-py-4v grid grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] items-center gap-x-8 border-x-0 border-t-0 border-b border-solid border-(--border-default-grey)"
            key={item.id}
          >
            <span>
              <Badge as="span" className="fr-mb-0 w-24 justify-center" noIcon>
                {item.formation}
              </Badge>
            </span>

            <span className="fr-px-2v flex items-center gap-x-2">
              {hasPdf ? (
                <LinkButton
                  data-plan-id={item.id}
                  disabled={openPresentationPdf.isPending}
                  iconId="fr-icon-file-text-line"
                  onClick={onOpenPdf}
                >
                  {name}
                </LinkButton>
              ) : (
                <span className="fr-link--icon-left fr-icon-file-text-line fr-icon--sm text-(--text-disabled-grey)">
                  {name}
                </span>
              )}

              {outdated && (
                <Badge as="span" className="fr-mb-0 shrink-0 rounded-full" severity="warning" small>
                  <FormattedMessage defaultMessage="À vérifier" />
                </Badge>
              )}
            </span>

            <span>
              <PresentationAuthoring {...authoring} />
            </span>

            <span>
              <PresentationRestitution {...restitution} />
            </span>

            <span className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
              {meeting.end && (
                <FormattedMessage defaultMessage="Séance de {start} à {end}" values={meeting} />
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
