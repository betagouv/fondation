import { renderHook } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { getMySessionFilesPath, useMyFilesFilter } from './useMyFilesFilter';

describe('getMySessionFilesPath', () => {
  it('opens the session with only the files of the member shown', () => {
    const path = getMySessionFilesPath({ sessionId: 'session', userId: 'member' });
    const searchParams = path.slice(path.indexOf('?'));

    const { result } = renderHook(() => useMyFilesFilter('member'), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <NuqsTestingAdapter searchParams={searchParams}>{children}</NuqsTestingAdapter>
      ),
    });

    expect(result.current[0]).toBe(true);
  });
});
