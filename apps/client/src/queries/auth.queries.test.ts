import { afterEach, describe, expect, it, vi } from 'vitest';

import { httpAssert } from '@/utils/http-exception';
import { tabImpersonation } from '@/utils/tab-impersonation';
import * as $api from '@api/sdk';

import { sessionQueryOptions } from './auth.queries';

type Introspection = Awaited<ReturnType<typeof $api.auth.introspectSession>>;

const ADMIN = {
  displayedRole: { label: 'Administrateur' },
  firstName: 'jess',
  gender: 'FEMALE',
  isAdmin: true,
  isImpersonated: false,
  lastName: 'test',
  userId: 'admin',
};

afterEach(() => {
  vi.restoreAllMocks();
  tabImpersonation.forget();
  window.history.replaceState(null, '', '/');
});

describe('sessionQueryOptions', () => {
  it('goes on with the admin session once the impersonation of the tab ended', async () => {
    window.history.replaceState(null, '', '/#impersonation=7b0f6e4c-2a51-4d6b-9a3e-1c2d3e4f5a6b');
    tabImpersonation.adoptFromAddress();
    vi.spyOn($api.auth, 'introspectSession')
      .mockImplementationOnce(async () => {
        // what the HTTP client does with the 401 of an ended impersonation
        tabImpersonation.end();
        return httpAssert(new Response(null, { status: 401 })) as never;
      })
      .mockResolvedValueOnce({ data: ADMIN } as unknown as Introspection);

    const user = await sessionQueryOptions.queryFn!({} as never);

    expect(user).toMatchObject({ id: 'admin', isImpersonated: false });
  });

  it('logs nobody in when the session itself is refused', async () => {
    vi.spyOn($api.auth, 'introspectSession').mockImplementation(
      async () => httpAssert(new Response(null, { status: 401 })) as never,
    );

    expect(await sessionQueryOptions.queryFn!({} as never)).toBeNull();
    expect($api.auth.introspectSession).toHaveBeenCalledOnce();
  });
});
