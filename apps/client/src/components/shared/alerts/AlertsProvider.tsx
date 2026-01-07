import React from 'react';

import { AlertsContext, type AlertContextType, type AlertProps } from './alerts.context';
import { Alert, type AlertProps as DsfrAlertProps } from '@codegouvfr/react-dsfr/Alert';

function AlertsProvider(props: React.PropsWithChildren) {
  const [alerts, setAlerts] = React.useState<AlertProps[]>([]);

  const pushAlert: AlertContextType['pushAlert'] = React.useCallback(
    (alert) => {
      setAlerts((a) => a.concat({ ...alert, id: crypto.randomUUID(), createdAt: new Date() }));
    },
    [setAlerts]
  );

  return <AlertsContext value={{ alerts, setAlerts, pushAlert }}>{props.children}</AlertsContext>;
}

AlertsProvider.Alerts = function InnerAlertList(
  props: Omit<DsfrAlertProps, 'severity' | 'id' | 'title' | 'description' | 'closable'> & {
    ref?: React.Ref<HTMLUListElement>;
    // closable by default
    closable?: false;
  }
) {
  const ctx = React.useContext(AlertsContext);

  if (!ctx || ctx.alerts.length === 0) return null;

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0" ref={props.ref}>
      {ctx.alerts.map((alert) => (
        <li key={alert.id}>
          <Alert
            severity={alert.severity}
            title={alert.title}
            description={alert.description}
            onClose={() => ctx.setAlerts(ctx.alerts.filter(({ id }) => id !== alert.id))}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(props as any)}
            closable={props.closable !== false}
          />
        </li>
      ))}
    </ul>
  );
};

export { AlertsProvider };
