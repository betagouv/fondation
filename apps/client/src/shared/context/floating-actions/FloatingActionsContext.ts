import { createContext } from 'react';

export const FloatingActionsContext = createContext<{
  setStack: (stack: HTMLElement | null) => void;
  stack: HTMLElement | null;
} | null>(null);
