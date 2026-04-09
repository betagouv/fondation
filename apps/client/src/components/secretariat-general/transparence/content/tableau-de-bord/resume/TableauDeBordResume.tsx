import { generatePath } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';
import type { DetailedNominationSessionDto } from '@api/types';

import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from '@/components/shared/menu';
import { DateOnly } from '@/models/date-only.model';
import { FormationEnumLabel } from '@/types/enums.types';
import { useListNominationFilesAsExcelMutation } from '@queries/nomination-sessions.queries';
import * as importAttachments from '../actions/ImportAttachmentModal';
import { TableauDeBordResumeDetails } from './TableauDeBordResumeDetails';

export const TableauDeBordResume = (transparence: DetailedNominationSessionDto) => {
  const date = DateOnly.fromDateOnly(transparence.date, 'dd/MM/yyyy');

  const { mutate: exportAsExcel } = useListNominationFilesAsExcelMutation();

  return (
    <div className="flex max-w-[67%] flex-col gap-y-2 px-2">
      <h1 className="mb-0 flex items-center justify-between gap-2">
        <span className="hyphens-auto">{transparence.name}</span>
        <MenuRoot>
          <MenuTrigger
            iconId="ri-menu-fill"
            className="flex-shrink-0 flex-grow-0 rounded-full"
            priority="tertiary no outline"
            title={`Actions sur la transparence "${transparence.name}"`}
          />

          <MenuContent>
            <MenuItem
              iconId="fr-icon-edit-fill"
              linkProps={{
                to: generatePath(ROUTE_PATHS.SG.SESSION_ID_EDIT, { sessionId: transparence.id })
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
