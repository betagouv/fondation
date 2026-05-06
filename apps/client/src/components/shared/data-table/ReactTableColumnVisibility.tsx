import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { flexRender, type RowData, type Table } from '@tanstack/react-table';

import { DropdownMenu } from '../DropdownMenu';

export function ReactTableColumnVisibility<Data extends RowData>(props: { table: Table<Data> }) {
  const canHideColumns = props.table.options.meta?.columnVisibilityEnabled;
  if (!canHideColumns) return null;

  const hidableColumns = props.table.getAllColumns().filter((column) => column.getCanHide());
  if (hidableColumns.length === 0) return null;

  // FIXME: at the moment the DropdownMenu does not handle the window collision too well...
  //        Consider migrating to https://base-ui.com/react/components/popover,
  //        which is the current (jan. 2026) state-of-the-art implementation.
  //        An approaching DSFR component, is flagged as BETA:
  //        https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/menu-deroulant
  return (
    <DropdownMenu
      trigger={
        <Button
          priority="tertiary no outline"
          className="rounded-full"
          title="Choisir quelles colonnes afficher"
          iconId="ri-equalizer-2-line"
        />
      }
    >
      <div className="max-h-96 overflow-y-auto bg-white px-2 pt-4 shadow-xl">
        <Checkbox
          small
          legend={<span className="text-sm font-bold uppercase">Colonnes</span>}
          options={hidableColumns.map((column) => {
            const isVisible = column.getIsVisible();
            // oxlint-disable-next-line @typescript-eslint/no-explicit-any
            const label = flexRender(column.columnDef.header, { table: props.table, column } as any);
            return {
              label,
              title: typeof label === 'string' ? (isVisible ? `Masquer ${label}` : `Afficher ${label}`) : '',
              key: column.id,
              nativeInputProps: {
                disabled: !column.getCanHide(),
                checked: column.getIsVisible(),
                onChange: column.getToggleVisibilityHandler()
              }
            };
          })}
        />
      </div>
    </DropdownMenu>
  );
}
