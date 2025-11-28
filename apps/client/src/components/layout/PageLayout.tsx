import type { PropsWithChildren } from 'react';

import { AppFooter } from './AppFooter';
import { AppHeader } from './Header';
import { StagingAppLayout } from '../shared/StagingAppLayout';

export const PageLayout: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <StagingAppLayout>
      <div className={`flex h-screen flex-col`}>
        <AppHeader />
        <main className="flex flex-grow">
          <div className="flex-grow">{children}</div>
        </main>
        <AppFooter />
      </div>
    </StagingAppLayout>
  );
};
