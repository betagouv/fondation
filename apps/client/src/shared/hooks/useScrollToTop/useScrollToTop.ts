import { useEffect } from 'react';

export function useScrollToTop(key: string | undefined) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [key]);
}
