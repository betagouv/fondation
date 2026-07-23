import { createContext, useContext } from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export const SIDE_PANEL_DOSSIER_PARAM = 'dossier';
export const SIDE_PANEL_ID = 'magistrat-panel';

export type SidePanelLeaveGuard = () => boolean;

export type SidePanelContextValue = {
  activeFile: SessionNominationFile | null;
  activeId: string | null;
  close: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  isLeaveBlocked: boolean;
  isOpen: boolean;
  next: () => void;
  open: (id: string) => void;
  previous: () => void;
  registerLeaveGuard: (guard: SidePanelLeaveGuard) => () => void;
  setLeaveBlocked: (key: string, blocked: boolean) => void;
};

export const SidePanelContext = createContext<SidePanelContextValue | null>(null);

export function useSidePanel() {
  const context = useContext(SidePanelContext);
  if (!context) throw new Error('useSidePanel must be used within a SidePanelProvider');
  return context;
}
