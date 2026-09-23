import Badge from '@codegouvfr/react-dsfr/Badge';
import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, type ChangeEvent, type MouseEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { PresentationAuthoring } from '@/features/documents/components/presentations/PresentationAuthoring';
import { usePresentPlanModal } from '@/features/documents/context/present-plan-modal.context';
import { PresentPlanModalProvider } from '@/features/documents/context/PresentPlanModalProvider';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { FormationEnumMessages } from '@/shared/enums/formation.enum';
import { useSelection } from '@/shared/hooks/useSelection';
import { SelectionCheckbox } from '@/shared/ui/checkbox';
import { IconButton } from '@/shared/ui/icon-button';
import { IconLink } from '@/shared/ui/icon-link';
import { ACTION_ICONS } from '@/shared/ui/icons';
import { LinkButton } from '@/shared/ui/link-button';
import { useToasts } from '@/shared/ui/toast';
import { formatDateOnly } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { timeOnlyToDate } from '@/utils/time-only.util';
import { toInitials } from '@/utils/user.utils';
import {
  useDeleteJusticePresentationPlanMutation,
  useListNonPresentedPlansQuery,
  useOpenJusticePresentationPlanPdfDocumentMutation,
} from '@queries/agenda.queries';

export function PresentationNoticesList() {
  return (
    <PresentPlanModalProvider>
      <InnerPresentationNoticesList />
    </PresentPlanModalProvider>
  );
}

function InnerPresentationNoticesList() {
  const confirmation = useConfirmModal();
  const toasts = useToasts();
  const { formatMessage } = useIntl();
  const { data: plans, isSuccess } = useListNonPresentedPlansQuery();

  const openPdf = useOpenJusticePresentationPlanPdfDocumentMutation();
  const mutateDeletion = useDeleteJusticePresentationPlanMutation();
  const presentPlanModal = usePresentPlanModal();

  const planItems = (plans?.items ?? []).map((item) => ({
    authoring: {
      createdAt: item.createdAt,
      createdBy: item.createdBy,
      updatedAt: item.updatedAt,
      updatedBy: item.updatedBy,
    },
    date: formatDateOnly(item.date),
    formation: formatMessage(FormationEnumMessages[item.formation]),
    hasRemovedAgendas: item.hasRemovedAgendas,
    id: item.id,
    initials: toInitials(item.chairman),
    isDraft: item.status === 'DRAFT',
    name: formatMessage(
      { defaultMessage: 'NDR {date}, {time, time, short} - {initials}' },
      {
        date: formatDateOnly(item.date),
        initials: toInitials(item.chairman),
        time: timeOnlyToDate(item.time),
      },
    ),
    outdated: item.outdated,
    startTime: item.time,
    time: timeOnlyToDate(item.time),
  }));

  const onClickOnPresentationPlan = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const { planId } = e.currentTarget.dataset;
      if (!planId) return;

      openPdf.mutate({ planId });
    },
    [openPdf],
  );

  const selection = useSelection({
    defaultSelection: [],
    items: planItems,
    toString: ({ id }) => id,
  });

  const onCheckboxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => selection.toggle(event.target.value, event.target.checked),
    [selection],
  );

  const present = useCallback(() => {
    const plans = planItems
      .filter((plan) => selection.has(plan))
      .map((plan) => ({ name: plan.name, planId: plan.id, startTime: plan.startTime }));
    if (plans.length === 0) return;

    presentPlanModal.presentPlans(plans);
  }, [planItems, presentPlanModal, selection]);

  const onClickDelete = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      const { planId: presentationPlanId } = e.currentTarget.dataset;
      if (!presentationPlanId) return;

      const { isConfirmed } = await confirmation.waitForConfirmation({
        content: (
          <>
            <p>
              <FormattedMessage defaultMessage="Vous allez supprimer cette notice." />
            </p>
            <p>
              <FormattedMessage defaultMessage="Voulez-vous continuer?" />
            </p>
          </>
        ),
        title: formatMessage({ defaultMessage: `Confirmer la suppression` }),
      });

      if (!isConfirmed) return;

      mutateDeletion.mutate(
        { presentationPlanId },
        {
          onError: () =>
            toasts.error({
              description: formatMessage({
                defaultMessage: 'Réessayez et prévenez le support si cela persiste.',
              }),
              title: formatMessage({
                defaultMessage: 'La suppression de la notice a échoué',
              }),
            }),
        },
      );
    },
    [confirmation, formatMessage, mutateDeletion, toasts],
  );

  const selectedCount = planItems.filter((plan) => selection.has(plan)).length;

  if (isSuccess && planItems.length === 0) {
    return (
      <p className="text-md fr-ml-2v text-(--text-mention-grey)">
        <FormattedMessage defaultMessage="Il n'y a aucune notice à restituer." />
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-y-8">
      <ul className="fr-m-0 fr-p-0 grid list-none grid-cols-[auto_auto_auto_minmax(0,1fr)_auto]">
        {planItems.map((plan) => {
          const { startTime: _, authoring, hasRemovedAgendas, isDraft, name, outdated, ...item } = plan;

          return (
            <li
              className="fr-py-4v col-span-full grid grid-cols-subgrid items-center gap-x-8 border-x-0 border-t-0 border-b border-solid border-(--border-default-grey)"
              key={item.id}
            >
              <SelectionCheckbox
                ariaLabel={name}
                checked={selection.has(plan)}
                disabled={isDraft}
                onChange={onCheckboxChange}
                value={item.id}
              />

              <span className="flex items-center gap-x-3">
                <Badge as="span" className="fr-mb-0 h-6 w-24 shrink-0 justify-center" noIcon small>
                  {item.formation}
                </Badge>

                <Badge
                  as="span"
                  className="fr-mb-0 h-6 shrink-0 rounded-full"
                  noIcon
                  severity={isDraft ? 'new' : 'success'}
                  small
                >
                  {isDraft ? (
                    <FormattedMessage defaultMessage="brouillon" />
                  ) : (
                    <FormattedMessage defaultMessage="validée" />
                  )}
                </Badge>
              </span>

              <span className="fr-px-2v flex items-center gap-x-2">
                {isDraft ? (
                  <span className="fr-link--icon-left fr-icon-file-text-line fr-icon--sm fr-text--sm fr-mb-0 text-(--text-disabled-grey)">
                    {name}
                  </span>
                ) : (
                  <LinkButton
                    data-plan-id={item.id}
                    disabled={openPdf.isPending}
                    iconId="fr-icon-file-text-line"
                    onClick={onClickOnPresentationPlan}
                  >
                    {name}
                  </LinkButton>
                )}

                {outdated && (
                  <Badge as="span" className="fr-mb-0 h-6 shrink-0 rounded-full" severity="warning" small>
                    <FormattedMessage defaultMessage="À vérifier" />
                  </Badge>
                )}

                {hasRemovedAgendas && (
                  <Badge as="span" className="fr-mb-0 h-6 shrink-0 rounded-full" noIcon severity="info" small>
                    <FormattedMessage defaultMessage="ODJ retiré" />
                  </Badge>
                )}
              </span>

              <span className="whitespace-nowrap">
                <PresentationAuthoring {...authoring} />
              </span>

              <span className="flex items-center justify-end gap-x-2">
                <IconLink
                  iconId={ACTION_ICONS.edit}
                  label={formatMessage({ defaultMessage: `Ouvrir la notice` })}
                  small
                  to={generatePath(ROUTE_PATHS.SG.PRESENTATIONS_PREVIEW, {
                    planId: item.id,
                  })}
                />

                <IconButton
                  className="hover:text-(--text-default-error)"
                  data-plan-id={item.id}
                  iconId={ACTION_ICONS.delete}
                  label={formatMessage({
                    defaultMessage: `Supprimer la notice`,
                  })}
                  onClick={onClickDelete}
                  small
                />
              </span>
            </li>
          );
        })}
      </ul>

      <Button className="self-end" disabled={selectedCount === 0} onClick={present}>
        <FormattedMessage
          defaultMessage="{count, plural, =0 {Restituer} one {Restituer la notice} other {Restituer les {count} notices}}"
          values={{ count: selectedCount }}
        />
      </Button>
    </div>
  );
}
