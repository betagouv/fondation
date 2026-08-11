import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import type { ReactNode } from 'react';

const TONES = {
  info: 'bg-(--background-contrast-info) text-(--text-default-info)',
  warning: 'bg-(--background-contrast-warning) text-(--text-default-warning)',
};

export function AlertBanner(props: {
  children?: ReactNode;
  className?: string;
  icon: string;
  message: ReactNode;
  tone: keyof typeof TONES;
}) {
  return (
    <div
      className={clsx(
        'flex min-h-6 items-center gap-2 text-sm-plus font-medium',
        TONES[props.tone],
        props.className,
      )}
    >
      <span aria-hidden className={clsx('fr-icon--sm shrink-0', props.icon)} />
      <span>{props.message}</span>
      {props.children}
    </div>
  );
}

export function AlertBannerAction(props: { children: ReactNode; onClick: () => void }) {
  return (
    <Button
      className="ml-auto min-h-0! px-3.5! py-0! whitespace-nowrap text-inherit! underline underline-offset-4 hover:bg-transparent! hover:decoration-2"
      onClick={props.onClick}
      priority="tertiary no outline"
      size="small"
    >
      {props.children}
    </Button>
  );
}
