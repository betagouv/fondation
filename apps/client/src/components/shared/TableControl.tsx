import Select from '@codegouvfr/react-dsfr/Select';
import { useState, type FC } from 'react';
import { Pagination } from '@codegouvfr/react-dsfr/Pagination';
import { ITEMS_PAR_PAGE } from '../../types/table.types';

export type TableControlProps = {
  onChange: (value: number) => void;
  itemsPerPage: number;
  totalItems: number;
  displayedItems: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
};

export const TableControl: FC<TableControlProps> = ({
  onChange,
  itemsPerPage: externalItemsPerPage,
  totalItems,
  displayedItems,
  totalPages,
  currentPage,
  setCurrentPage
}) => {
  const [internalItemsPerPage, setInternalItemsPerPage] = useState<number>(50);
  const value = externalItemsPerPage ?? internalItemsPerPage;

  const handleChange = (newValue: number) => {
    if (externalItemsPerPage === undefined) {
      setInternalItemsPerPage(newValue);
    }
    onChange(newValue);
  };

  return (
    <div className="flex items-center justify-between gap-16">
      <div className="flex items-center gap-6">
        <div className="text-sm text-gray-600">
          Affichage de {displayedItems} sur {totalItems} dossiers
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
        // TODO REPLACE THIS LOGIC WITH LINK PROPS LOGIC
        getPageLinkProps={(pageNumber) => ({
          onClick: () => setCurrentPage(pageNumber)
        })}
        showFirstLast
      />
    </div>
  );
};
