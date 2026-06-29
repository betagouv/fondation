import { colors } from '@codegouvfr/react-dsfr';
import clsx from 'clsx';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';

import { useArchivedSession } from '@/shared/context/archived-session';
import { useConfirmation } from '@/shared/context/confirmation';
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/shared/ui/menu';
import { FormationEnumLabel } from '@/types/enums.types';
import { dateOnlyToDate } from '@/utils/date-only.util';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedNominationSessionDto } from '@api/types';
import {
  useArchiveNominationSessionMutation,
  useDeleteNominationSessionMutation,
  useListNominationFilesAsExcelMutation,
} from '@queries/nomination-sessions.queries';

import * as importAttachments from './ImportAttachmentModal';
import { TableauDeBordResumeDetails } from './TableauDeBordResumeDetails';

export const TableauDeBordResume = (transparence: DetailedNominationSessionDto) => {
  const { isArchived } = useArchivedSession();
  const navigate = useNavigate();
  const confirmation = useConfirmation();

  const exportAsExcelMutation = useListNominationFilesAsExcelMutation();
  const deleteSessionMutation = useDeleteNominationSessionMutation({ sessionId: transparence.id });
  const archiveSessionMutation = useArchiveNominationSessionMutation({ sessionId: transparence.id });

  const onArchive = React.useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: `Confirmer l'archivage`,
      content: (
        <>
          <p>
            <FormattedMessage
              defaultMessage={'Vous allez archiver la transparence «\u00A0{name}\u00A0».'}
              values={{ name: transparence.name }}
            />
          </p>
          <p>
            <FormattedMessage defaultMessage={'Souhaitez-vous continuer\u00A0?'} />
          </p>
        </>
      ),
    });

    if (!isConfirmed) return;

    archiveSessionMutation.mutate(undefined, {
      onSuccess: () => navigate(ROUTE_PATHS.SG.MANAGE_SESSION),
    });
  }, [confirmation, transparence.name, archiveSessionMutation, navigate]);

  const onDelete = React.useCallback(async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      title: `Confirmer la suppression`,
      content: (
        <>
          <p>
            <FormattedMessage
              defaultMessage={'Vous allez supprimer la transparence «\u00A0{name}\u00A0».'}
              values={{ name: transparence.name }}
            />
          </p>
          <p>
            <FormattedMessage
              defaultMessage={"Une fois confirmé, <bold>il est impossible d'annuler la suppression.</bold>"}
              values={{ bold: (label) => <strong className="font-bold">{label}</strong> }}
            />
          </p>
          <p>
            <FormattedMessage defaultMessage={'Êtes-vous sûr de vouloir continuer\u00A0?'} />
          </p>
        </>
      ),
    });

    if (!isConfirmed) return;

    deleteSessionMutation.mutate(undefined, {
      onSuccess: () => navigate(ROUTE_PATHS.SG.MANAGE_SESSION),
    });
  }, [confirmation, transparence.name, deleteSessionMutation, navigate]);

  const isMutationPending =
    deleteSessionMutation.isPending || archiveSessionMutation.isPending || exportAsExcelMutation.isPending;

  return (
    <div className="fr-px-2v flex max-w-[63%] flex-col gap-y-2">
      <h1 className="fr-mb-0 flex items-center justify-between gap-2">
        <span className="hyphens-auto">{transparence.name}</span>
        <MenuRoot disabled={isMutationPending}>
          <MenuTrigger
            disabled={isMutationPending}
            iconId={isMutationPending ? 'ri-loader-4-line' : 'ri-menu-fill'}
            className={clsx('shrink-0 grow-0 rounded-full', {
              "before:animate-spin before:content-['']": isMutationPending,
            })}
            priority="tertiary no outline"
            title={`Actions sur la transparence "${transparence.name}"`}
          />

          <MenuContent>
            {!isArchived && (
              <>
                <MenuItem
                  iconId="fr-icon-edit-fill"
                  linkProps={{
                    to: generatePath(ROUTE_PATHS.SG.SESSION_ID_EDIT, { sessionId: transparence.id }),
                  }}
                >
                  Éditer
                </MenuItem>
                <MenuItem
                  disabled={isMutationPending}
                  iconId="fr-icon-file-add-line"
                  nativeButtonProps={importAttachments.modal.buttonProps}
                >
                  Pièces jointes
                </MenuItem>
              </>
            )}
            <MenuItem
              disabled={isMutationPending}
              iconId="ri-file-download-line"
              onClick={() => {
                exportAsExcelMutation.mutate({ sessionId: transparence.id });
              }}
            >
              Export .xlsx
            </MenuItem>

            {transparence.isArchivable && (
              <MenuItem
                disabled={isMutationPending}
                nativeButtonProps={confirmation.buttonProps}
                iconId={archiveSessionMutation.isPending ? 'ri-loader-4-fill' : 'fr-icon-archive-fill'}
                onClick={onArchive}
                style={{ color: colors.decisions.text.actionHigh.yellowTournesol.default }}
                className={clsx({
                  "before:animate-spin before:content-['']": archiveSessionMutation.isPending,
                })}
              >
                <FormattedMessage defaultMessage="Archiver" />
              </MenuItem>
            )}

            {!isArchived && transparence.isDeletable && (
              <MenuItem
                disabled={isMutationPending}
                nativeButtonProps={confirmation.buttonProps}
                iconId={deleteSessionMutation.isPending ? `ri-loader-4-fill` : 'ri-delete-bin-fill'}
                onClick={onDelete}
                className={clsx('before text-(--text-default-error)', {
                  "before:animate-spin before:content-['']": deleteSessionMutation.isPending,
                })}
              >
                Supprimer
              </MenuItem>
            )}
          </MenuContent>
        </MenuRoot>
      </h1>

      <div className="flex max-w-xl flex-col gap-y-2">
        <div className="flex items-center justify-between gap-6">
          <p className="fr-m-0 text-sm text-(--text-mention-grey)">
            <FormattedMessage
              defaultMessage="Transparence du {date, date, dateOnlyShort}"
              values={{ date: dateOnlyToDate(transparence.date) }}
            />
          </p>
          <span className="fr-p-1v rounded-sm bg-(--background-contrast-grey) text-xs font-semibold text-(--text-mention-grey) uppercase">
            {FormationEnumLabel[transparence.formation]}
          </span>
        </div>

        <TableauDeBordResumeDetails {...transparence} />
      </div>
    </div>
  );
};
