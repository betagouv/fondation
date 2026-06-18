import type React from 'react';

export function SummaryContainer({ children }: React.PropsWithChildren) {
  return (
    <div className="fr-py-12v min-h-full bg-(--background-contrast-info)">
      <div className="fr-container flex flex-row justify-center">{children}</div>
    </div>
  );
}
