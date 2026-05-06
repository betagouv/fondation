import { type AlertProps as DsfrAlertProps } from '@codegouvfr/react-dsfr/Alert';
import React from 'react';

type AlertSeverity = DsfrAlertProps['severity'];
export type AlertProps = {
  id: string;
  severity: AlertSeverity;
  title: React.ReactNode;
  description?: React.ReactNode;
  createdAt: Date;
};

export type AlertContextType = {
  alerts: readonly AlertProps[];
  pushAlert(options: Omit<AlertProps, 'id' | 'createdAt'>): void;
  setAlerts: (alerts: AlertProps[]) => void;
};
export const AlertsContext = React.createContext<AlertContextType | null>(null);

export function useAlerts(): Pick<AlertContextType, 'pushAlert'> {
  return React.useContext(AlertsContext) as any; // oxlint-disable-line @typescript-eslint/no-explicit-any
}
