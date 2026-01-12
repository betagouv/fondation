import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import type { RowData, Table } from '@tanstack/react-table';
import type { PropsWithChildren } from 'react';

/** @see https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/tableau/design-du-tableau */
export function ReactTableWrapper<Data extends RowData>(props: PropsWithChildren<{ table: Table<Data> }>) {
  const shouldHideCaption = props.table.options.enableColumnFilters || props.table.options.enableGlobalFilter;

  return (
    <div className={cx('fr-table', shouldHideCaption && 'fr-table--no-caption')}>
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content flex">
            <table className="flex-grow table-fixed" style={{ width: 'initial' }}>
              {props.children}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
