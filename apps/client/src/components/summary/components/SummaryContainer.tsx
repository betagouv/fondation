import type React from 'react';

export function SummaryContainer({ children }: React.PropsWithChildren) {
  return (
    <div className="min-h-full bg-light-blue py-12">
      <div className="fr-container flex flex-row justify-center">{children}</div>
    </div>
  );
}
