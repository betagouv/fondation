import type { ReactNode } from 'react';

export function TitleNameIcons(props: { children: ReactNode; name: string | null }) {
  const words = (props.name ?? '').split(' ');
  const tail = words.pop();
  const start = words.join(' ');

  return (
    <>
      {start && `${start} `}
      <span className="inline-flex items-center whitespace-nowrap">
        {tail}
        <span className="ml-2 inline-flex items-center">{props.children}</span>
      </span>
    </>
  );
}
