import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useCallback, useMemo, useState, type ChangeEvent, type MouseEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

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
import { normalizeSessionName } from '@/utils/session.utils';
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
    items,
    defaultSelection: [],
    toString: ({ id }) => id,
  });

  const selectedItems = items.filter((item) => selection.has(item));

  /** a notice carries one formation, so the first pick closes the door on the other one */
  const pickedFormation = selectedItems[0]?.formation;

  const onCheckboxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => selection.toggle(event.target.value, event.target.checked),
    [selection],
  );

  const { mutateAsync: detailsAgenda, isPending: isOpeningAgenda } = useDetailsSessionAgendaMutation();
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
      <ul className="fr-m-0 fr-p-0 list-none">
        {items.map((item) => {
          const isLockedOut = Boolean(pickedFormation && item.formation !== pickedFormation);

          return (
            <li
              className="fr-py-4v flex items-center gap-x-8 border-x-0 border-t-0 border-b border-solid border-(--border-default-grey)"
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
                className={clsx('fr-mb-0 w-24 shrink-0 justify-center', {
                  'text-(--text-disabled-grey)': isLockedOut,
                })}
                noIcon
              >
                {formatMessage(FormationEnumMessages[item.formation])}
              </Badge>

              <span className="fr-px-2v grow">
                {isLockedOut || !item.validatedAt ? (
                  <span className="fr-link--icon-left fr-icon-file-text-line fr-icon--sm text-(--text-disabled-grey)">
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
                className={clsx('fr-text--sm fr-mb-0 fr-ml-2v w-64', {
                  'text-(--text-disabled-grey)': isLockedOut,
                  'text-(--text-mention-grey)': !isLockedOut,
                })}
              >
                {normalizeSessionName(item.session)}
              </span>

              <span className="whitespace-nowrap">
                <AgendaValidation
                  createdAt={item.createdAt}
                  createdBy={item.createdBy}
                  validatedAt={item.validatedAt}
                  validatedBy={item.validatedBy}
                />
              </span>
            </li>
          );
        })}
      </ul>

      <Button className="self-end" disabled={selectedItems.length === 0 || isNavigating} onClick={generate}>
        <FormattedMessage defaultMessage="Générer une notice" />
      </Button>
    </div>
  );
}
