import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useCallback, useMemo, useState, type ChangeEvent, type MouseEvent } from 'react';
import { FormattedList, FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link } from 'react-router';

import { AgendaValidation } from '@/features/documents/components/presentations/PresentationAuthoring';
import { usePresentationPlan } from '@/features/documents/context/presentation-plan.context';
import { FormationEnumMessages } from '@/shared/enums/formation.enum';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { useSelection } from '@/shared/hooks/useSelection';
import { useTab } from '@/shared/hooks/useTab';
import { SelectionCheckbox } from '@/shared/ui/checkbox';
import { LinkButton } from '@/shared/ui/link-button';
import { useToasts } from '@/shared/ui/toast';
import { compareDateOnly, formatDateOnly } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { normalizeSessionName } from '@/utils/session.utils';
import { timeOnlyToDate } from '@/utils/time-only.util';
import { toInitials } from '@/utils/user.utils';
import type { FoundAgendasDto } from '@api/types';
import { useDetailsSessionAgendaMutation } from '@queries/agenda.queries';

type Agenda = FoundAgendasDto['items'][number];

export function PresentationAgendaSelectionTable(props: { items: readonly Agenda[] | undefined }) {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const describeFailure = useDocumentFailure();
  const tab = useTab();

  const items = useMemo(
    () =>
      [...(props.items ?? [])]
        .sort((a, b) => compareDateOnly(a.sessionMeetingDate, b.sessionMeetingDate))
        .map((item) => ({
          ...item,
          draftNotices: item.draftPresentationPlans.map((plan) => ({
            id: plan.id,
            name: formatMessage(
              { defaultMessage: 'NDR {date}, {time, time, short} - {initials}' },
              {
                date: formatDateOnly(plan.date),
                initials: toInitials(plan.chairman),
                time: timeOnlyToDate(plan.startTime),
              },
            ),
          })),
          name: formatMessage(
            { defaultMessage: 'ODJ - {date} - {initials}' },
            {
              date: formatDateOnly(item.sessionMeetingDate),
              initials: toInitials(item.chairman),
            },
          ),
        })),
    [formatMessage, props.items],
  );

  const selection = useSelection({
    defaultSelection: [],
    items,
    toString: ({ id }) => id,
  });

  const selectedItems = items.filter((item) => selection.has(item));

  /** a notice carries one formation, so the first pick closes the door on the other one */
  const pickedFormation = selectedItems[0]?.formation;

  const onCheckboxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => selection.toggle(event.target.value, event.target.checked),
    [selection],
  );

  const { isPending: isOpeningAgenda, mutateAsync: detailsAgenda } = useDetailsSessionAgendaMutation();
  const onClickOnAgenda = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const agenda = items.find((item) => item.id === e.currentTarget.dataset.agendaId);
      if (!agenda) return;

      const agendaTab = tab.openDeferred({
        message: formatMessage({
          defaultMessage: 'Préparation du document, merci de patienter...',
        }),
        title: agenda.name,
      });

      return detailsAgenda({
        agendaId: agenda.id,
        sessionId: agenda.session.id,
      })
        .then(({ url }) => agendaTab.settle(url))
        .catch((error: unknown) => {
          agendaTab.cancel();
          toasts.error({
            description: describeFailure(error),
            title: formatMessage({
              defaultMessage: `Le document n'a pas pu être ouvert`,
            }),
          });
        });
    },
    [describeFailure, detailsAgenda, formatMessage, items, tab, toasts],
  );

  const [isNavigating, setIsNavigating] = useState(false);
  const { initPlanCreation } = usePresentationPlan();
  const generate = useCallback(() => {
    if (!pickedFormation || isNavigating) return;

    setIsNavigating(true);
    initPlanCreation({
      agendaIds: selectedItems.map(({ id }) => id),
      formation: pickedFormation,
    });
  }, [initPlanCreation, isNavigating, pickedFormation, selectedItems]);

  if (items.length === 0) {
    return (
      <p className="text-md fr-ml-2v text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Il n'y a aucun ordre du jour en attente de notice." />
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-y-8">
      <ul className="fr-m-0 fr-p-0 grid list-none grid-cols-[auto_auto_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1.7fr)]">
        {items.map((item) => {
          const isLockedOut = Boolean(pickedFormation && item.formation !== pickedFormation);

          return (
            <li
              className="fr-py-4v col-span-full grid min-h-16 grid-cols-subgrid items-center gap-x-8 border-x-0 border-t-0 border-b border-solid border-(--border-default-grey)"
              key={item.id}
            >
              <SelectionCheckbox
                ariaLabel={item.name}
                checked={selection.has(item)}
                disabled={isLockedOut}
                onChange={onCheckboxChange}
                value={item.id}
              />

              <Badge
                as="span"
                className={clsx('fr-mb-0 h-6 w-24 shrink-0 justify-center', {
                  'text-(--text-disabled-grey)': isLockedOut,
                })}
                noIcon
                small
              >
                {formatMessage(FormationEnumMessages[item.formation])}
              </Badge>

              <span className="fr-pr-2v fr-pl-10v">
                {isLockedOut || !item.validatedAt ? (
                  <span className="fr-link--icon-left fr-icon-file-text-line fr-icon--sm fr-text--sm fr-mb-0 text-(--text-disabled-grey)">
                    {item.name}
                  </span>
                ) : (
                  <LinkButton
                    data-agenda-id={item.id}
                    disabled={isOpeningAgenda}
                    iconId="fr-icon-file-text-line"
                    onClick={onClickOnAgenda}
                  >
                    {item.name}
                  </LinkButton>
                )}
              </span>

              <span
                className={clsx('fr-text--sm fr-mb-0', {
                  'text-(--text-disabled-grey)': isLockedOut,
                  'text-(--text-mention-grey)': !isLockedOut,
                })}
              >
                {normalizeSessionName(item.session)}
              </span>

              <span className="flex flex-col gap-y-1">
                <span className="whitespace-nowrap">
                  <AgendaValidation
                    createdAt={item.createdAt}
                    createdBy={item.createdBy}
                    draftPath={generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, {
                      agendaId: item.id,
                      sessionId: item.session.id,
                    })}
                    validatedAt={item.validatedAt}
                    validatedBy={item.validatedBy}
                  />
                </span>

                {item.draftNotices.length > 0 && (
                  <span className="fr-text--sm fr-mb-0 fr-ml-2v text-(--text-mention-grey)">
                    <FormattedMessage
                      defaultMessage="{count, plural, one {Dans la notice en brouillon} other {Dans les notices en brouillon}} {notices}"
                      values={{
                        count: item.draftNotices.length,
                        notices: (
                          <FormattedList
                            type="conjunction"
                            value={item.draftNotices.map((notice) => (
                              <Link
                                className="fr-link fr-link--sm whitespace-nowrap"
                                key={notice.id}
                                to={generatePath(ROUTE_PATHS.SG.PRESENTATIONS_PREVIEW, { planId: notice.id })}
                              >
                                {notice.name}
                              </Link>
                            ))}
                          />
                        ),
                      }}
                    />
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-end gap-x-4">
        <p aria-live="polite" className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
          {selectedItems.length > 0 && (
            <FormattedMessage
              defaultMessage="{count, plural, one {# ordre du jour sélectionné} other {# ordres du jour sélectionnés}}"
              values={{ count: selectedItems.length }}
            />
          )}
        </p>

        <Button disabled={selectedItems.length === 0 || isNavigating} onClick={generate}>
          <FormattedMessage defaultMessage="Générer une notice" />
        </Button>
      </div>
    </div>
  );
}
