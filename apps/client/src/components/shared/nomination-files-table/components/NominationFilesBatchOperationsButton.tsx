import { Button } from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useCallback, useMemo, useState } from 'react';

import type { PrioriteEnum } from '@/types/enums.types';
import { useMemberListQuery } from '@queries/members.queries';

import { useAffectations } from '../contexts/files-affectations.context';
import { useSelectedFileIds } from '../contexts/files-selection.context';
import { useNominationFilesTable } from '../contexts/files-table.context';

import { NominationFilesReporterSelector } from './NominationFilesReporterSelector';
import { NominationFilesPrioritySelector } from './NominationFilesPrioritySelector';

const actionsGroupeesModal = createModal({
  id: 'actions-groupees-modal',
  isOpenedByDefault: false
});

export function NominationFilesBatchOperationsButton() {
  const { formation } = useNominationFilesTable();
  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 }
  });

  const availableRapporteurs = useMemo(
    () => (data?.items ?? []).map(({ id, firstName, lastName }) => ({ userId: id, firstName, lastName })),
    [data]
  );

  const selectedFileIds = useSelectedFileIds();
  const { affectReporters, prioritize } = useAffectations();
  const hasSelection = useMemo(() => selectedFileIds.length > 0, [selectedFileIds]);

  const [localSelection, setLocalSelection] = useState<string[]>([]);
  const [localPriorite, setLocalPriorite] = useState<PrioriteEnum | null | undefined>(undefined);

  const handleOpenModal = useCallback(() => {
    setLocalSelection([]);
    setLocalPriorite(undefined);
    actionsGroupeesModal.open();
  }, [setLocalSelection, setLocalPriorite]);

  const handleCancel = useCallback(() => {
    setLocalSelection([]);
    setLocalPriorite(undefined);
    actionsGroupeesModal.close();
  }, [setLocalSelection, setLocalPriorite]);

  const handleApply = useCallback(() => {
    if (localSelection.length > 0) {
      affectReporters(Object.fromEntries(selectedFileIds.map((fileId) => [fileId, localSelection] as const)));
    }

    if (localPriorite !== undefined) {
      prioritize(Object.fromEntries(selectedFileIds.map((fileId) => [fileId, localPriorite] as const)));
    }

    setLocalSelection([]);
    setLocalPriorite(undefined);
    actionsGroupeesModal.close();
  }, [
    selectedFileIds,
    affectReporters,
    prioritize,
    setLocalPriorite,
    setLocalSelection,
    localPriorite,
    localSelection
  ]);

  return (
    <>
      <Button
        priority="secondary"
        iconId="fr-icon-menu-fill"
        disabled={!hasSelection}
        onClick={handleOpenModal}
      >
        Actions groupées
      </Button>

      <actionsGroupeesModal.Component
        title="Actions groupées"
        buttons={[
          {
            children: 'Annuler',
            priority: 'secondary',
            onClick: handleCancel
          },
          {
            children: 'Appliquer',
            onClick: handleApply
          }
        ]}
      >
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="mb-2 text-base font-semibold">Définir une priorité</h3>
            <NominationFilesPrioritySelector
              selectedPriorite={localPriorite}
              onPrioriteChange={setLocalPriorite}
            />
          </div>

          <div className="border-t border-gray-200 pt-2">
            <h3 className="mb-2 text-base font-semibold">Affecter des rapporteurs</h3>
            <NominationFilesReporterSelector
              availableRapporteurs={availableRapporteurs}
              selectedRapporteurs={localSelection}
              onSelectionChange={setLocalSelection}
            />
          </div>
        </div>
      </actionsGroupeesModal.Component>
    </>
  );
}
