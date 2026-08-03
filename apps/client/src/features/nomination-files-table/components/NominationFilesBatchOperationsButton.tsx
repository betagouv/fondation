import { Button } from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useAffectations } from '../context/files-affectations.context';
import { useSelectedFileIds, useSelectedFiles } from '../context/files-selection.context';
import { useNominationFilesTable } from '../context/files-table.context';
import {
  useExcludedJurisdictionConflicts,
  useExcludedJurisdictionTitles,
} from '../hooks/useExcludedJurisdictionConflicts.hook';
import { PrioriteEnum, PrioriteEnumLabels } from '@/types/enums.types';
import { useMemberListQuery } from '@queries/members.queries';

import { ExcludedJurisdictionWarningList } from './ExcludedJurisdictionWarningList';
import { NominationFilesReporterSelector } from './NominationFilesReporterSelector';

const actionsGroupeesModal = createModal({
  id: 'actions-groupees-modal',
  isOpenedByDefault: false,
});

type None = 'NONE';
const PRIORITY_VALUES = ([] as (PrioriteEnum | None)[]).concat(Object.values(PrioriteEnum), 'NONE');

export function NominationFilesBatchOperationsButton() {
  const { formatMessage } = useIntl();
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
  const selectedFiles = useSelectedFiles();
  const { affectReporters, prioritize } = useAffectations();
  const hasSelection = selectedFileIds.length > 0;

  const [localSelection, setLocalSelection] = useState<string[]>([]);
  const [localPriorities, setLocalPriorities] = useState<(PrioriteEnum | None)[]>([]);

  const availableIds = useMemo(
    () => availableRapporteurs.map(({ userId }) => userId),
    [availableRapporteurs],
  );
  const conflicts = useExcludedJurisdictionConflicts({ files: selectedFiles, memberIds: availableIds });
  const excludedTitleByRapporteurId = useExcludedJurisdictionTitles(conflicts);
  const selectedConflicts = useMemo(
    () => conflicts.filter(({ memberId }) => localSelection.includes(memberId)),
    [conflicts, localSelection],
  );

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
        <FormattedMessage defaultMessage="Actions" />
      </Button>

      <actionsGroupeesModal.Component
        title={formatMessage({ defaultMessage: 'Actions groupées' })}
        buttons={[
          {
            children: formatMessage({ defaultMessage: 'Annuler' }),
            priority: 'secondary',
            onClick: handleCancel,
          },
          {
            children: formatMessage({ defaultMessage: 'Appliquer' }),
            onClick: handleApply,
          },
        ]}
      >
        <div className="flex flex-col gap-2">
          <div>
            <h3 className="fr-mb-2v text-base font-semibold">
              <FormattedMessage defaultMessage="Définir les priorités" />
            </h3>
            <Checkbox
              orientation="horizontal"
              options={PRIORITY_VALUES.map((value) => ({
                value,
                label:
                  value === 'NONE' ? formatMessage({ defaultMessage: 'Aucune' }) : PrioriteEnumLabels[value],
                nativeInputProps: {
                  checked: localPriorities.includes(value),
                  onChange: (e) => togglePriority(value, e),
                },
              }))}
            />
          </div>

          <div className="fr-pt-2v border-t border-(--border-default-grey)">
            <h3 className="fr-mb-2v text-base font-semibold">
              <FormattedMessage defaultMessage="Affecter des rapporteurs" />
            </h3>
            <NominationFilesReporterSelector
              availableRapporteurs={availableRapporteurs}
              excludedTitleByRapporteurId={excludedTitleByRapporteurId}
              selectedRapporteurs={localSelection}
              onSelectionChange={setLocalSelection}
            />
            <ExcludedJurisdictionWarningList conflicts={selectedConflicts} />
          </div>
        </div>
      </actionsGroupeesModal.Component>
    </>
  );
}
