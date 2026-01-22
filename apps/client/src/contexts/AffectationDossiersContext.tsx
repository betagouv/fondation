import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
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
  setFilesSelection: (selection: Record<string, boolean>) => void;
  hasChanges: boolean;
}

const AffectationContext = createContext<AffectationContextType | undefined>(undefined);

export const AffectationProvider = ({
  children,
  selection,
  nominationFiles
}: PropsWithChildren<{
  selection: Record<string, boolean>;
  nominationFiles: readonly SessionNominationFile[];
}>) => {
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

  const updateFiles = useCallback(
    (
      filesUpdate: Record<
        string,
        {
          reporterIds?: readonly string[];
          priority?: PrioriteEnum | null;
          isSelected?: boolean;
        }
      >
    ) => {
      setState((map) => {
        const unselected = Object.fromEntries(
          Object.entries(map).map(([fileId, fileState]) => [fileId, { ...fileState, isSelected: false }])
        );

        const updated = Object.fromEntries(
          Object.entries(filesUpdate).map(([fileId, newState]) => {
            const {
              reporterIds: existingReporterIds = [],
              priority: existingPriority = null,
              isSelected: existingSelected = false
            } = map[fileId] ?? fileById.get(fileId) ?? {};

            return [
              fileId,
              {
                reporterIds: new Set(newState.reporterIds ?? existingReporterIds),
                priority: newState.priority === undefined ? existingPriority : newState.priority,
                isSelected: newState.isSelected ?? existingSelected
              }
            ] as const;
          })
        );

        return {
          ...unselected,
          ...updated
        };
      });
    },
    [fileById]
  );

  const updateAffectation = useCallback(
    (fileId: string, reporterIds: readonly string[]) => updateFiles({ [fileId]: { reporterIds } }),
    [updateFiles]
  );

  const updatePriorite = useCallback(
    (fileId: string, priority: PrioriteEnum | null) => updateFiles({ [fileId]: { priority } }),
    [updateFiles]
  );

  const clearPriorite = useCallback(
    (fileId: string) => updateFiles({ [fileId]: { priority: null } }),
    [updateFiles]
  );

  const applyPrioriteValue = useCallback(
    (fileId: string, priority: PrioriteValue) =>
      priority !== undefined ? updateFiles({ [fileId]: { priority } }) : undefined,
    [updateFiles]
  );

  const resetAffectations = useCallback(() => {
    setState({});
  }, [setState]);

  const setFilesSelection = useCallback(
    (selection: Record<string, boolean>) => {
      updateFiles(
        Object.fromEntries(
          Object.entries(selection).map(([fileId, isSelected]) => [fileId, { isSelected }] as const)
        )
      );
    },
    [updateFiles]
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

  useEffect(() => {
    setFilesSelection(selection);
  }, [selection, setFilesSelection]);

  const hasChanges = useMemo(
    () =>
      Object.entries(state).some(([fileId, { priority, reporterIds }]) => {
        const origin = fileById.get(fileId);
        if (!origin) return false;

        return (
          origin.priority !== priority ||
          reporterIds.size !== origin.reporterIds.length ||
          JSON.stringify([...reporterIds].toSorted()) !== JSON.stringify(origin.reporterIds.toSorted())
        );
      }),
    [state, fileById]
  );
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
        setFilesSelection,
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
