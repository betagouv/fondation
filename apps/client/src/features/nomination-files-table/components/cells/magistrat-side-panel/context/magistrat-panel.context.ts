import { createContext, useContext } from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

export const MAGISTRAT_PANEL_DOSSIER_PARAM = 'dossier';
export const MAGISTRAT_PANEL_ID = 'magistrat-panel';

export type MagistratPanelLeaveGuard = () => boolean;

export type MagistratPanelContextValue = {
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
  registerLeaveGuard: (guard: MagistratPanelLeaveGuard) => () => void;
  setLeaveBlocked: (key: string, blocked: boolean) => void;
};

export const MagistratPanelContext = createContext<MagistratPanelContextValue | null>(null);

export function useMagistratPanel() {
  const context = useContext(MagistratPanelContext);
  if (!context) throw new Error('useMagistratPanel must be used within a MagistratPanelProvider');
  return context;
}
