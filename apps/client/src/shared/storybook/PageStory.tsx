import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router';

import { BanneredLayout } from '@/shared/components/banners';
import { ArchivedSessionProvider } from '@/shared/context/archived-session';
import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { ToastProvider } from '@/shared/ui/toast';
import { authKeys } from '@queries/auth.queries';

import { STORY_USERS, type StoryView } from './story-users';
import { StoryQueryClient } from './StoryQueryClient';

// the providers of PageLayout, without its header and footer. The page is matched against `location`
// rather than the story router, so that one story can switch between the SG and member routes
export function PageStory(props: {
  children: ReactNode;
  location: string;
  path: string;
  seed?: (client: QueryClient) => void;
  view: StoryView;
}) {
  return (
    <StoryQueryClient
      key={props.view}
      seed={(client) => {
        client.setQueryData(authKeys.introspectSession(), STORY_USERS[props.view]);
        props.seed?.(client);
      }}
    >
      <ToastProvider>
        <ConfirmModalProvider>
          <ArchivedSessionProvider>
            <BanneredLayout>
              <Routes location={props.location}>
                <Route element={props.children} path={props.path} />
              </Routes>
            </BanneredLayout>
          </ArchivedSessionProvider>
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}
