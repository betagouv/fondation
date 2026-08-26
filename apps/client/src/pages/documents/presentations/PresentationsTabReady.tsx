import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useCallback, type MouseEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { PresentationAgendaSelectionList } from '@/features/presentations/components/PresentationAgendaSelectionList';
import { usePresentPlanModal } from '@/features/presentations/context/present-plan-modal.context';
import { PresentPlanModalProvider } from '@/features/presentations/context/PresentPlanModalProvider';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useToasts } from '@/shared/ui/toast';
import { FormationEnumLabel } from '@/types/enums.types';
import { dateOnlyToDate } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { timeOnlyToDate } from '@/utils/time-only.util';
import { toInitials } from '@/utils/user.utils';
import {
  useDeleteJusticePresentationPlanMutation,
  useListNonPresentedPlansQuery,
  useListPresentationPlansAgendasQuery,
  useOpenJusticePresentationPlanPdfDocumentMutation,
} from '@queries/agenda.queries';

export function PresentationsTabReady() {
  return (
    <PresentPlanModalProvider>
      <InnerPresentationsTabReady />
    </PresentPlanModalProvider>
  );
}

function InnerPresentationsTabReady() {
  const confirmation = useConfirmModal();
  const toasts = useToasts();
  const { $t } = useIntl();
  const { data: plans, isFetching: isFetchingPlans } = useListNonPresentedPlansQuery();
  const { data: agendas, isFetching: isFetchingAgendas } = useListPresentationPlansAgendasQuery();

  const openPdf = useOpenJusticePresentationPlanPdfDocumentMutation();
  const mutateDeletion = useDeleteJusticePresentationPlanMutation();
  const presentPlanModal = usePresentPlanModal();

  const isFetching = isFetchingPlans || isFetchingAgendas;

  const planItems = (plans?.items ?? []).map((item) => {
    const formation = FormationEnumLabel[item.formation];
    const date = dateOnlyToDate(item.date);
    const time = timeOnlyToDate(item.time);
    const initials = toInitials(item.chairman);

    return { id: item.id, formation, date, time, startTime: item.time, initials };
  });

  const onClickOnPresentationPlan = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const { planId } = e.currentTarget.dataset;
      if (!planId) return;

      openPdf.mutate({ planId });
    },
    [openPdf],
  );

  const onClickPresent = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      const { planId } = e.currentTarget.dataset;
      if (!planId) return;

      const plan = planItems.find((p) => p.id === planId);
      if (!plan) return;

      presentPlanModal.presentPlan({ planId, startTime: plan.startTime });
    },
    [planItems, presentPlanModal],
  );

  const onClickDelete = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      const { planId: presentationPlanId } = e.currentTarget.dataset;
      if (!presentationPlanId) return;

      const { isConfirmed } = await confirmation.waitForConfirmation({
        title: $t({ defaultMessage: `Confirmer la suppression` }),
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
      });

      if (!isConfirmed) return;

      mutateDeletion.mutate(
        { presentationPlanId },
        {
          onError: () =>
            toasts.error({
              description: $t({ defaultMessage: 'Réessayez et prévenez le support si cela persiste.' }),
              title: $t({ defaultMessage: 'La suppression de la notice a échoué' }),
            }),
        },
      );
    },
    [confirmation, mutateDeletion, toasts, $t],
  );

  if (isFetching) {
    return (
      <div className="fr-container">
        <p
          className={clsx(
            'text-md text-center text-(--text-mention-grey) before:animate-spin before:content-[""]',
            cx('ri-loader-4-line'),
          )}
        >
          <FormattedMessage defaultMessage="Chargement..." />
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-10">
      {planItems.length > 0 && (
        <div>
          <h2 className={clsx('uppercase', cx('fr-h4'))}>
            <FormattedMessage defaultMessage="Notices" />
          </h2>

          <ul className="fr-m-0 fr-p-0 list-none">
            {planItems.map(({ startTime: _, ...item }) => (
              <li className="flex items-center" key={item.id}>
                <Button
                  disabled={openPdf.isPending}
                  iconId="ri-file-pdf-2-line"
                  nativeButtonProps={{ ['data-plan-id']: item.id }}
                  onClick={onClickOnPresentationPlan}
                  priority="tertiary no outline"
                  size="small"
                >
                  <FormattedMessage
                    defaultMessage="NDR {date, date, dateOnlyShort}, {time, time, short} - {initials} - {formation}"
                    values={item}
                  />
                </Button>

                <div className="actions fr-ml-10v flex items-center gap-x-2">
                  <Button
                    className="bg-(--background-contrast-yellow-moutarde)! font-bold text-(--text-action-high-yellow-moutarde)! uppercase hover:bg-(--background-contrast-yellow-moutarde-hover)! active:bg-(--background-contrast-yellow-moutarde-active)!"
                    nativeButtonProps={{ onClick: onClickPresent, 'data-plan-id': item.id }}
                    size="small"
                    title={$t({ defaultMessage: 'Marquer restitué' })}
                  >
                    <FormattedMessage defaultMessage="Restituer" />
                  </Button>

                  <Button
                    className="rounded-full"
                    iconId="fr-icon-edit-fill"
                    linkProps={{
                      to: generatePath(ROUTE_PATHS.SG.PRESENTATIONS_UPDATE, { planId: item.id }),
                    }}
                    priority="tertiary no outline"
                    size="small"
                    title={$t({ defaultMessage: `Éditer` })}
                  />

                  <Button
                    className="rounded-full hover:text-(--text-default-error)"
                    iconId="fr-icon-delete-bin-fill"
                    nativeButtonProps={{ 'data-plan-id': item.id, onClick: onClickDelete }}
                    priority="tertiary no outline"
                    size="small"
                    title={$t({ defaultMessage: `Supprimer` })}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(agendas?.items ?? []).length > 0 && (
        <div>
          <h2 className="fr-h4 uppercase">
            <FormattedMessage defaultMessage="Ordres du jour" />
          </h2>

          <div className="flex gap-x-20">
            <section>
              <PresentationAgendaSelectionList formation={'SIEGE'} items={agendas?.items} />
            </section>

            <section>
              <PresentationAgendaSelectionList formation={'PARQUET'} items={agendas?.items} />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
