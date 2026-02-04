import { type AlertProps as DsfrAlertProps } from '@codegouvfr/react-dsfr/Alert';
import React from 'react';

type AlertSeverity = DsfrAlertProps['severity'];

export const ALERT_PRESETS = {
  DATA_UPDATED: { severity: 'success', title: 'Données actualisées', autoClose: true }
} as const satisfies Record<string, Omit<AlertProps, 'id' | 'createdAt'> & { autoClose?: boolean }>;

export type AlertProps = {
  id: string;
  severity: AlertSeverity;
  title: React.ReactNode;
  description?: React.ReactNode;
  createdAt: Date;
};

export type AlertContextType = {
  alerts: readonly AlertProps[];
  pushAlert(options: Omit<AlertProps, 'id' | 'createdAt'> & { timeout?: number; autoClose?: boolean }): void;
  setAlerts: (alerts: AlertProps[]) => void;
};
export const AlertsContext = React.createContext<AlertContextType | null>(null);

export function useAlerts(): Pick<AlertContextType, 'pushAlert'> {
  return React.useContext(AlertsContext) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}
