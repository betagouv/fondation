import { createContext } from 'react';

type ArchivedSessionContextType = {
  isArchived: boolean;
  setIsArchived: (isArchived: boolean) => void;
};

export const ArchivedSessionContext = createContext<ArchivedSessionContextType | null>(null);
