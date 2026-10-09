import type { ReactNode } from 'react';

import { splitNameEnd } from '@/utils/magistrat-name.utils';

export function TitleNameIcons(props: { children: ReactNode; name: string | null }) {
  const { end, start } = splitNameEnd(props.name ?? '');

  return (
    <>
      {start && `${start} `}
      <span className="inline-flex items-center whitespace-nowrap">
        {end}
        <span className="ml-2 inline-flex items-center">{props.children}</span>
      </span>
    </>
  );
}
