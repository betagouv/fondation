import { Button } from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useCallback, useMemo, useState } from 'react';

import { useAffectations } from '../contexts/files-affectations.context';
import { useSelectedFileIds } from '../contexts/files-selection.context';
import { useNominationFilesTable } from '../contexts/files-table.context';
import { PrioriteEnum, PrioriteEnumLabels } from '@/types/enums.types';
import { useMemberListQuery } from '@queries/members.queries';

import { NominationFilesReporterSelector } from './NominationFilesReporterSelector';

const actionsGroupeesModal = createModal({
  id: 'actions-groupees-modal',
  isOpenedByDefault: false,
});

type None = 'NONE';
const PRIORITIES = ([] as (PrioriteEnum | None)[]).concat(Object.values(PrioriteEnum), 'NONE').map((x) => ({
  value: x,
  label: x === 'NONE' ? 'Aucune' : PrioriteEnumLabels[x],
}));

export function NominationFilesBatchOperationsButton() {
  const { formation } = useNominationFilesTable();
  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 },
  });

  const availableRapporteurs = useMemo(
    () =>
      (data?.items ?? []).map(({ id, firstName, lastName }) => ({
        userId: id,
        firstName,
        lastName,
      })),
    [data],
  );

  const selectedFileIds = useSelectedFileIds();
  const { affectReporters, prioritize } = useAffectations();
  const hasSelection = useMemo(() => selectedFileIds.length > 0, [selectedFileIds]);

  const [localSelection, setLocalSelection] = useState<string[]>([]);
  const [localPriorities, setLocalPriorities] = useState<(PrioriteEnum | None)[]>([]);

  const handleOpenModal = useCallback(() => {
    setLocalSelection([]);
    setLocalPriorities([]);
    actionsGroupeesModal.open();
  }, [setLocalSelection, setLocalPriorities]);

  const handleCancel = useCallback(() => {
    setLocalSelection([]);
    setLocalPriorities([]);
    actionsGroupeesModal.close();
  }, [setLocalSelection, setLocalPriorities]);

  const handleApply = useCallback(() => {
    if (localSelection.length > 0) {
      affectReporters(Object.fromEntries(selectedFileIds.map((fileId) => [fileId, localSelection] as const)));
    }

    if (localPriorities.length > 0) {
      prioritize(
        Object.fromEntries(
          selectedFileIds.map(
            (fileId) =>
              [
                fileId,
                localPriorities.includes('NONE')
                  ? new Set()
                  : new Set(localPriorities.filter((x) => x !== 'NONE')),
              ] as const,
          ),
        ),
      );
    }

    setLocalSelection([]);
    setLocalPriorities([]);
    actionsGroupeesModal.close();
  }, [
    selectedFileIds,
    affectReporters,
    prioritize,
    setLocalPriorities,
    setLocalSelection,
    localPriorities,
    localSelection,
  ]);

  const togglePriority = useCallback(
    (priority: PrioriteEnum | None, e: React.ChangeEvent<HTMLInputElement>): void => {
      if (e.target.checked) {
        if (priority === 'NONE') return setLocalPriorities(['NONE']);
        setLocalPriorities((p) => p.filter((x) => x !== 'NONE').concat(priority));
      } else {
        setLocalPriorities((p) => p.filter((x) => x !== priority));
      }
    },
    [],
  );

  return (
    <>
      <Button
        size="small"
        priority="secondary"
        iconId="ri-settings-4-fill"
        disabled={!hasSelection}
        onClick={handleOpenModal}
      >
        Actions
      </Button>

      <actionsGroupeesModal.Component
        title="Actions groupées"
        buttons={[
          {
            children: 'Annuler',
            priority: 'secondary',
            onClick: handleCancel,
          },
          {
            children: 'Appliquer',
            onClick: handleApply,
          },
        ]}
      >
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="fr-mb-2v text-base font-semibold">Définir les priorités</h3>
            <Checkbox
              orientation="horizontal"
              options={PRIORITIES.map((option) => ({
                ...option,
                nativeInputProps: {
                  checked: localPriorities.includes(option.value),
                  onChange: (e) => togglePriority(option.value, e),
                },
              }))}
            />
          </div>

          <div className="fr-pt-2v border-t border-gray-200">
            <h3 className="fr-mb-2v text-base font-semibold">Affecter des rapporteurs</h3>
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
