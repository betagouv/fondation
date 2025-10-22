import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { PrioriteEnum } from 'shared-models/models/priorite.enum';

export interface DossierAffectation {
  dossierId: string;
  rapporteurIds: string[];
  priorite?: PrioriteEnum;
}

export type AffectationsState = {
  [dossierId: string]: string[];
};

export type PrioritesState = {
  [dossierId: string]: PrioriteEnum | undefined;
};

interface AffectationContextType {
  affectations: AffectationsState;
  priorites: PrioritesState;
  updateAffectation: (dossierId: string, rapporteurIds: string[]) => void;
  updatePriorite: (dossierId: string, priorite: PrioriteEnum) => void;
  resetAffectations: () => void;
  getAllAffectations: () => DossierAffectation[];
  hasChanges: boolean;
}

const AffectationContext = createContext<AffectationContextType | undefined>(undefined);

interface AffectationProviderProps {
  children: ReactNode;
  initialAffectations?: AffectationsState;
  initialPriorites?: PrioritesState;
}

export const AffectationProvider = ({
  children,
  initialAffectations = {},
  initialPriorites = {}
}: AffectationProviderProps) => {
  const [affectations, setAffectations] = useState<AffectationsState>(initialAffectations);
  const [priorites, setPriorites] = useState<PrioritesState>(initialPriorites);

  const updateAffectation = useCallback((dossierId: string, rapporteurIds: string[]) => {
    setAffectations((prev) => ({
      ...prev,
      [dossierId]: rapporteurIds
    }));
  }, []);

  const updatePriorite = useCallback((dossierId: string, priorite: PrioriteEnum) => {
    setPriorites((prev) => ({
      ...prev,
      [dossierId]: priorite
    }));
  }, []);

  const resetAffectations = useCallback(() => {
    setAffectations(initialAffectations);
    setPriorites(initialPriorites);
  }, [initialAffectations, initialPriorites]);

  const getAllAffectations = useCallback((): DossierAffectation[] => {
    const dossierIds = new Set([...Object.keys(affectations), ...Object.keys(priorites)]);
    return Array.from(dossierIds).map((dossierId) => ({
      dossierId,
      rapporteurIds: affectations[dossierId] || [],
      priorite: priorites[dossierId]
    }));
  }, [affectations, priorites]);

  const hasChanges = useCallback(() => {
    return (
      JSON.stringify(affectations) !== JSON.stringify(initialAffectations) ||
      JSON.stringify(priorites) !== JSON.stringify(initialPriorites)
    );
  }, [affectations, priorites, initialAffectations, initialPriorites])();

  return (
    <AffectationContext.Provider
      value={{
        affectations,
        priorites,
        updateAffectation,
        updatePriorite,
        resetAffectations,
        getAllAffectations,
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
