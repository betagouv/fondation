import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

export interface DossierAffectation {
  dossierId: string;
  rapporteurIds: string[];
}

export type AffectationsState = {
  [dossierId: string]: string[];
};

interface AffectationContextType {
  affectations: AffectationsState;
  updateAffectation: (dossierId: string, rapporteurIds: string[]) => void;
  resetAffectations: () => void;
  getAllAffectations: () => DossierAffectation[];
  hasChanges: boolean;
}

const AffectationContext = createContext<AffectationContextType | undefined>(undefined);

interface AffectationProviderProps {
  children: ReactNode;
  initialAffectations?: AffectationsState;
}

export const AffectationProvider = ({ children, initialAffectations = {} }: AffectationProviderProps) => {
  const [affectations, setAffectations] = useState<AffectationsState>(initialAffectations);

  const updateAffectation = useCallback((dossierId: string, rapporteurIds: string[]) => {
    setAffectations((prev) => ({
      ...prev,
      [dossierId]: rapporteurIds
    }));
  }, []);

  const resetAffectations = useCallback(() => {
    setAffectations(initialAffectations);
  }, [initialAffectations]);

  const getAllAffectations = useCallback((): DossierAffectation[] => {
    return Object.entries(affectations).map(([dossierId, rapporteurIds]) => ({
      dossierId,
      rapporteurIds
    }));
  }, [affectations]);

  const hasChanges = useCallback(() => {
    return JSON.stringify(affectations) !== JSON.stringify(initialAffectations);
  }, [affectations, initialAffectations])();

  return (
    <AffectationContext.Provider
      value={{
        affectations,
        updateAffectation,
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
