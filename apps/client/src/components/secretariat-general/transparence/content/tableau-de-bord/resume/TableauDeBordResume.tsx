import clsx from 'clsx';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, useNavigate } from 'react-router';

import * as importAttachments from '../actions/ImportAttachmentModal';
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/components/shared/menu';
import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { DateOnly } from '@/models/date-only.model';
import { FormationEnumLabel } from '@/types/enums.types';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedNominationSessionDto } from '@api/types';
import {
  useDeleteNominationSessionMutation,
  useListNominationFilesAsExcelMutation,
} from '@queries/nomination-sessions.queries';

import { TableauDeBordResumeDetails } from './TableauDeBordResumeDetails';

export const TableauDeBordResume = (transparence: DetailedNominationSessionDto) => {
  const navigate = useNavigate();
  const confirmation = useConfirmation();
  const date = DateOnly.fromDateOnly(transparence.date, 'dd/MM/yyyy');

  const { mutate: exportAsExcel } = useListNominationFilesAsExcelMutation();
  const deleteSessionMutation = useDeleteNominationSessionMutation({ sessionId: transparence.id });

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
  }, [confirmation, transparence, deleteSessionMutation, navigate]);

  return (
    <div className="flex max-w-[63%] flex-col gap-y-2 px-2">
      <h1 className="mb-0 flex items-center justify-between gap-2">
        <span className="hyphens-auto">{transparence.name}</span>
        <MenuRoot>
          <MenuTrigger
            disabled={deleteSessionMutation.isPending}
            iconId={deleteSessionMutation.isPending ? 'ri-loader-4-line' : 'ri-menu-fill'}
            className={clsx('flex-shrink-0 flex-grow-0 rounded-full', {
              "before:animate-spin before:content-['']": deleteSessionMutation.isPending,
            })}
            priority="tertiary no outline"
            title={`Actions sur la transparence "${transparence.name}"`}
          />

          <MenuContent>
            <MenuItem
              iconId="fr-icon-edit-fill"
              linkProps={{
                to: generatePath(ROUTE_PATHS.SG.SESSION_ID_EDIT, { sessionId: transparence.id }),
              }}
            >
              Éditer
            </MenuItem>
            <MenuItem iconId="fr-icon-file-add-line" nativeButtonProps={importAttachments.modal.buttonProps}>
              Pièces jointes
            </MenuItem>
            <MenuItem
              iconId="ri-file-download-line"
              onClick={() => {
                exportAsExcel({ sessionId: transparence.id });
              }}
            >
              Export .xlsx
            </MenuItem>

            {transparence.isDeletable && (
              <MenuItem
                disabled={deleteSessionMutation.isPending}
                nativeButtonProps={confirmation.buttonProps}
                iconId={deleteSessionMutation.isPending ? `ri-loader-4-fill` : 'ri-delete-bin-fill'}
                onClick={onDelete}
                className={clsx('before text-red-600', {
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
          <p className="m-0 text-sm text-gray-600">Transparence du {date}</p>
          <span className="rounded bg-gray-100 p-1 text-xs font-semibold uppercase text-gray-600">
            {FormationEnumLabel[transparence.formation]}
          </span>
        </div>

        <TableauDeBordResumeDetails {...transparence} />
      </div>
    </div>
  );
};
