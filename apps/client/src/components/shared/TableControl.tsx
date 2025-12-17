import { Pagination } from '@codegouvfr/react-dsfr/Pagination';
import Select from '@codegouvfr/react-dsfr/Select';
import { useMemo, useState, type FC } from 'react';
import { ITEMS_PAR_PAGE } from '../../types/table.types';
import { pluralize } from '../../utils/string.utils';

export type TableControlProps = {
  onChange: (value: number) => void;
  itemsPerPage: number;
  totalItems: number;
  displayedItems: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  label?: string | { one: string; other: string };
  getPageUrl?: (pageNumber: number) => string;
};

export const TableControl: FC<TableControlProps> = ({
  onChange,
  itemsPerPage: externalItemsPerPage,
  totalItems,
  displayedItems,
  totalPages,
  currentPage,
  label = 'sessions',
  setCurrentPage,
  getPageUrl
}) => {
  const [internalItemsPerPage, setInternalItemsPerPage] = useState<number>(50);
  const value = externalItemsPerPage ?? internalItemsPerPage;

  const handleChange = (newValue: number) => {
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
            onChange: (event) => handleChange(Number(event.target.value)),
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
        getPageLinkProps={(pageNumber) =>
          getPageUrl
            ? { to: getPageUrl(pageNumber) }
            : {
                onClick: () => setCurrentPage(pageNumber),
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                to: undefined
              }
        }
        showFirstLast
      />
    </div>
  );
};
