import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import type { EditedPosition } from '../components/PositionVacancySidePanel';

import { useEditedPosition } from './useEditedPosition';

type Row = { court: string; magistrat: { id: string; name: string } | null };

const ROWS: Row[] = [
  { court: 'Agen', magistrat: { id: 'a', name: 'Alice' } },
  { court: 'Amiens', magistrat: null },
  { court: 'Angers', magistrat: { id: 'b', name: 'Bruno' } },
];

function editedPositionOf(row: Row): EditedPosition | null {
  return (
    row.magistrat && {
      alerts: [],
      installationDate: null,
      magistrat: { ...row.magistrat, title: `Premier président de la cour d'appel ${row.court}` },
      status: { detail: null, hint: null, id: 'OCCUPIED', label: 'Occupé' },
    }
  );
}

/** the neighbours are read ahead, never answered here */
function renderEditedPosition(rows: readonly Row[]) {
  const client = new QueryClient({ defaultOptions: { queries: { enabled: false } } });
  return renderHook(({ shown }) => useEditedPosition(shown, editedPositionOf, () => {}), {
    initialProps: { shown: rows },
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children),
  });
}

describe('useEditedPosition', () => {
  it('keeps the neighbours of a position that a filter left out', () => {
    const { rerender, result } = renderEditedPosition([
      ...ROWS,
      { court: 'Bastia', magistrat: { id: 'c', name: 'Chloé' } },
    ]);
    act(() => result.current.open(ROWS[2]!));

    rerender({ shown: [ROWS[0]!, { court: 'Bastia', magistrat: { id: 'c', name: 'Chloé' } }] });

    expect(result.current.edited?.magistrat.name).toBe('Bruno');
    act(() => result.current.next?.());
    expect(result.current.edited?.magistrat.name).toBe('Chloé');
  });

  it('moves to the next position with a holder, and stops on the last one', () => {
    const { result } = renderEditedPosition(ROWS);

    act(() => result.current.open(ROWS[0]!));
    act(() => result.current.next?.());

    expect(result.current.edited?.magistrat.name).toBe('Bruno');
    expect(result.current.next).toBeUndefined();
    expect(result.current.previous).toBeDefined();
  });

  it('stays on its position while the form tells what it lacks', () => {
    const { result } = renderEditedPosition(ROWS);
    act(() => result.current.open(ROWS[0]!));

    act(() => result.current.setLeaveBlocked(true));
    act(() => result.current.next?.());
    act(() => result.current.close());

    expect(result.current.edited?.magistrat.name).toBe('Alice');
  });
});
