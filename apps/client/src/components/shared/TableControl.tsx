import Select from '@codegouvfr/react-dsfr/Select';
import { useMemo, useState, type FC } from 'react';
import { Pagination } from '@codegouvfr/react-dsfr/Pagination';
import { ITEMS_PAR_PAGE } from '../../types/table.types';
import type { ItemsPerPage } from '../../hooks/usePagination.hook';
import { pluralize } from '../../utils/string.utils';

export type TableControlProps = {
  onChange: (value: ItemsPerPage) => void;
  itemsPerPage: number;
  totalItems: number;
  displayedItems: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  label?: string | { one: string; other: string };
};

export const TableControl: FC<TableControlProps> = ({
  onChange,
  itemsPerPage: externalItemsPerPage,
  totalItems,
  displayedItems,
  totalPages,
  currentPage,
  label = 'sessions',
  setCurrentPage
}) => {
  const [internalItemsPerPage, setInternalItemsPerPage] = useState<number>(50);
  const value = externalItemsPerPage ?? internalItemsPerPage;

  const handleChange = (newValue: ItemsPerPage) => {
    if (externalItemsPerPage === undefined) {
      setInternalItemsPerPage(newValue);
    }
    onChange(newValue);
  };

  const displayedLabel = useMemo(
    () => (typeof label === 'string' ? label : pluralize(totalItems, label)),
    [label, totalItems]
  );

  return (
    <div className="flex items-center justify-between gap-16">
      <div className="flex items-center gap-6">
        <div className="text-sm text-gray-600">
          Affichage de {displayedItems} sur {totalItems} {displayedLabel}
        </div>
        <Select
          label=""
          id="items-par-page"
          className={'flex max-w-[400px]'}
          nativeSelectProps={{
            onChange: (event) => handleChange(+event.target.value as ItemsPerPage),
            value
          }}
        >
          {ITEMS_PAR_PAGE.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
      <Pagination
        count={totalPages}
        defaultPage={currentPage}
        // TODO REPLACE THIS LOGIC WITH LINK PROPS LOGIC
        getPageLinkProps={(pageNumber) => ({
          onClick: () => setCurrentPage(pageNumber)
        })}
        showFirstLast
      />
    </div>
  );
};
