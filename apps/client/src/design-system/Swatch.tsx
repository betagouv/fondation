import React from 'react';

function rgbToHex(color: string): string {
  const channels = color.match(/[\d.]+/g);
  if (!channels || channels.length < 3) return color;
  const [r, g, b, a] = channels.map(Number);
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  const alpha = a !== undefined && a < 1 ? toHex(a * 255) : '';
  return ('#' + toHex(r) + toHex(g) + toHex(b) + alpha).toUpperCase();
}

export function Swatch(props: { name: string; variable: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [hex, setHex] = React.useState('');

  React.useEffect(() => {
    if (ref.current) setHex(rgbToHex(getComputedStyle(ref.current).backgroundColor));
  }, []);

  return (
    <figure className="m-0 w-52.5">
      <div
        className="h-14 rounded-md border border-(--border-default-grey)"
        ref={ref}
        style={{ background: props.variable }}
      />
      <figcaption className="mt-2 leading-relaxed">
        <div className="font-bold">{hex}</div>
        <div>{props.name}</div>
        <code className="text-xs text-(--text-mention-grey)">{props.variable}</code>
      </figcaption>
    </figure>
  );
}

export function SwatchGrid(props: { children: React.ReactNode }) {
  return <div className="my-4 flex flex-wrap gap-6">{props.children}</div>;
}
