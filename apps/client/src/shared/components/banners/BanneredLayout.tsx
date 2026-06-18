import clsx from 'clsx';
import React from 'react';

import { ImpersonationBanner } from '@/features/auth/components/ImpersonationBanner';

import { ArchiveBanner } from './archived-banner/ArchivedSessionBanner';
import { StagingBanner } from './StagingBanner';

export function Banners(
  props: React.PropsWithChildren<{ hidden: boolean; ref: React.RefObject<HTMLDivElement | null> }>,
) {
  return (
    <div
      ref={props.ref}
      className={clsx('fixed top-0 right-0 left-0 z-1000 flex flex-col', props.hidden && 'opacity-0')}
    >
      {props.children}
    </div>
  );
}

export function BanneredLayout(props: React.PropsWithChildren) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState({ hidden: false, height: -1 });

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height;
      setState({ height, hidden: height === 0 });
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <>
      <Banners ref={ref} hidden={state.hidden}>
        <StagingBanner />
        <ImpersonationBanner key={'ImpersonationBanner'} />
        <ArchiveBanner key={'ArchivedSessionBanner'} />
      </Banners>

      <div style={{ marginTop: state.height }}>{props.children}</div>
    </>
  );
}
