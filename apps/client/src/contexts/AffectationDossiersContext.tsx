import { type PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { PrioriteEnum } from '@/types/enums.types';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export type PrioriteValue = PrioriteEnum | null | undefined;

export interface DossierAffectation {
  dossierId: string;
  rapporteurIds: string[];
  priorite: PrioriteEnum | null;
}

export type AffectationsState = {
  [dossierId: string]: string[];
};

export type PrioritesState = {
  [dossierId: string]: PrioriteValue;
};

interface AffectationContextType {
  affectations: AffectationsState;
  priorites: PrioritesState;
  selectedDossierIds: Set<string>;
  updateAffectation: (dossierId: string, rapporteurIds: string[]) => void;
  updatePriorite: (dossierId: string, priorite: PrioriteEnum) => void;
  clearPriorite: (dossierId: string) => void;
  applyPrioriteValue: (dossierId: string, priorite: PrioriteValue) => void;
  resetAffectations: () => void;
  getAllAffectations: () => DossierAffectation[];
  toggleDossierSelection: (dossierId: string) => void;
  hasChanges: boolean;
}

const AffectationContext = createContext<AffectationContextType | undefined>(undefined);

export const AffectationProvider = ({
  children,
  nominationFiles
}: PropsWithChildren<{ nominationFiles: readonly SessionNominationFile[] }>) => {
  const fileById = useMemo(
    () =>
      new Map(
        nominationFiles.map((f) => [
          f.id,
          {
            isSelected: false,
            priority: f.priority,
            reporterIds: f.reporters.map(({ id }) => id) as readonly string[]
          }
        ])
      ),
    [nominationFiles]
  );

  const [state, setState] = useState<
    Record<string, { reporterIds: Set<string>; priority: PrioriteEnum | null; isSelected?: boolean }>
  >({});

  const updateFile = useCallback(
    (
      fileId: string,
      newState: {
        reporterIds?: readonly string[];
        priority?: PrioriteEnum | null;
        isSelected?: (value: boolean) => boolean;
      }
    ) => {
      setState((map) => {
        const {
          reporterIds: existingReporterIds = [],
          priority: existingPriority = null,
          isSelected: existingSelected = false
        } = map[fileId] ?? fileById.get(fileId) ?? {};

        return {
          ...map,
          [fileId]: {
            isSelected: newState.isSelected?.(existingSelected) ?? existingSelected,
            priority: newState.priority === undefined ? existingPriority : newState.priority,
            reporterIds: new Set(newState.reporterIds ?? existingReporterIds)
          }
        };
      });
    },
    [fileById]
  );

  const updateAffectation = useCallback(
    (fileId: string, reporterIds: readonly string[]) => updateFile(fileId, { reporterIds }),
    [updateFile]
  );

  const updatePriorite = useCallback(
    (fileId: string, priority: PrioriteEnum | null) => updateFile(fileId, { priority }),
    [updateFile]
  );

  const clearPriorite = useCallback((fileId: string) => updateFile(fileId, { priority: null }), [updateFile]);

  const applyPrioriteValue = useCallback(
    (fileId: string, priority: PrioriteValue) =>
      priority !== undefined ? updateFile(fileId, { priority }) : undefined,
    [updateFile]
  );

  const resetAffectations = useCallback(() => {
    setState({});
  }, []);

  const toggleDossierSelection = useCallback(
    (fileId: string) => updateFile(fileId, { isSelected: (value) => !value }),
    [updateFile]
  );

  const getAllAffectations = useCallback(
    (): DossierAffectation[] =>
      Object.entries(state).map(([dossierId, { reporterIds, priority }]) => ({
        dossierId,
        priorite: priority,
        rapporteurIds: Array.from(reporterIds)
      })),
    [state]
  );

  const hasChanges = useMemo(() => Object.keys(state).length > 0, [state]);
  const affectations = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(state).map(([fileId, { reporterIds }]) => [fileId, Array.from(reporterIds)])
      ),
    [state]
  );
  const priorites = useMemo(
    () =>
      Object.fromEntries(Object.entries(state).map(([fileId, { priority }]) => [fileId, priority] as const)),
    [state]
  );
  const selectedDossierIds = useMemo(
    () =>
      new Set(
        Object.entries(state)
          .filter(([_id, { isSelected }]) => isSelected) // eslint-disable-line @typescript-eslint/no-unused-vars
          .map(([id]) => id)
      ),
    [state]
  );

  return (
    <AffectationContext.Provider
      value={{
        affectations,
        priorites,
        selectedDossierIds,
        updateAffectation,
        updatePriorite,
        clearPriorite,
        applyPrioriteValue,
        resetAffectations,
        getAllAffectations,
        toggleDossierSelection,
        hasChanges
      }}
    >
      {children}
    </AffectationContext.Provider>
  );
};

export const useAffectation = (): AffectationContextType => {
  const context = useContext(AffectationContext);
  if (!context) {
    throw new Error('useAffectation must be used within an AffectationProvider');
  }
  return context;
};
