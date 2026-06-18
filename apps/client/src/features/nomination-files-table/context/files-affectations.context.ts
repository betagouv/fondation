import React from 'react';

import type { PrioriteEnum } from '@/types/enums.types';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

type AffectationFile = { id: string; priorities: PrioriteEnum[]; reporterIds: Set<string> };

class SingleFileAffectation {
  #priorities?: Set<PrioriteEnum>;
  #reporterIds?: Set<string>;

  constructor(readonly original: AffectationFile) {}

  toJSON(): { id: string; priorities: PrioriteEnum[]; reporterIds: string[] } {
    return {
      id: this.original.id,
      priorities: [...(this.#priorities ?? this.original.priorities)],
      reporterIds: [...(this.#reporterIds ?? this.original.reporterIds)],
    };
  }

  get hasChanges(): boolean {
    return this.#priorities !== undefined || this.#reporterIds !== undefined;
  }

  setReporterIds(reporterIds: Set<string>) {
    if (reporterIds.size === this.original.reporterIds.size) {
      for (const x of this.original.reporterIds) {
        if (!reporterIds.has(x)) {
          this.#reporterIds = reporterIds;
          return;
        }
      }

      this.#reporterIds = undefined;
      return;
    }

    this.#reporterIds = reporterIds;
  }

  setPriorities(priorities: Set<PrioriteEnum>): void {
    if (priorities.size === this.original.priorities.length) {
      for (const priority of this.original.priorities) {
        if (!priorities.has(priority)) {
          this.#priorities = new Set(priorities);
          return;
        }
      }

      this.#priorities = undefined;
      return;
    }

    this.#priorities = new Set(priorities);
  }

  reset(): void {
    this.#priorities = undefined;
    this.#reporterIds = undefined;
  }
}

export class FilesAffectationsState implements Iterable<{
  id: string;
  reporterIds: string[];
  priorities: PrioriteEnum[];
}> {
  readonly hasChanges: boolean = false;
  private constructor(readonly affectations: Map<string, SingleFileAffectation>) {
    for (const file of affectations.values()) {
      if (file.hasChanges) {
        this.hasChanges = true;
        break;
      }
    }
  }

  static from(originals: AffectationFile[]): FilesAffectationsState {
    return new FilesAffectationsState(new Map(originals.map((o) => [o.id, new SingleFileAffectation(o)])));
  }

  affect(affectations: Record<string, readonly string[]>): FilesAffectationsState {
    for (const [id, reporterIds] of Object.entries(affectations)) {
      this.affectations.get(id)?.setReporterIds(new Set(reporterIds));
    }

    return new FilesAffectationsState(new Map(this.affectations));
  }

  prioritize(priorities: Record<string, Set<PrioriteEnum>>): FilesAffectationsState {
    for (const [id, priority] of Object.entries(priorities)) {
      this.affectations.get(id)?.setPriorities(priority);
    }

    return new FilesAffectationsState(new Map(this.affectations));
  }

  reset(): FilesAffectationsState {
    for (const file of this.affectations.values()) file.reset();

    return new FilesAffectationsState(new Map(this.affectations));
  }

  toJSON() {
    return Array.from(this);
  }

  *[Symbol.iterator]() {
    for (const affectation of this.affectations.values()) {
      if (affectation.hasChanges) {
        yield affectation.toJSON();
      }
    }
  }
}

type AffectationAction =
  | { type: 'affect'; affectations: Record<string, readonly string[]> }
  | { type: 'prioritize'; priorities: Record<string, Set<PrioriteEnum>> }
  | { type: 'reset' }
  | { type: 'init'; files: readonly SessionNominationFile[] };

function stateInitializer(files: readonly SessionNominationFile[]): FilesAffectationsState {
  return FilesAffectationsState.from(
    files.map((file) => ({
      id: file.id,
      priorities: file.priorities,
      reporterIds: new Set(file.reporters.map(({ id }) => id)),
    })),
  );
}

function reducer(state: FilesAffectationsState, action: AffectationAction): FilesAffectationsState {
  switch (action.type) {
    case 'affect':
      return state.affect(action.affectations);
    case 'prioritize':
      return state.prioritize(action.priorities);
    case 'reset':
      return state.reset();
    case 'init':
      return stateInitializer(action.files);
  }
}

type FilesAffectationsContextType = {
  hasChanges: boolean;
  resetAffectations: () => void;
  prioritize: (priorities: Record<string, Set<PrioriteEnum>>) => void;
  affectReporters: (affectations: Record<string, readonly string[]>) => void;
  getAffectations: () => { id: string; priorities: PrioriteEnum[]; reporterIds: string[] }[];
};

type InternalFilesAffectationsContextType = FilesAffectationsContextType & {
  root: FilesAffectationsState;
};

export const FilesAffectationsContext = React.createContext(
  null as unknown as InternalFilesAffectationsContextType,
);

/** @internal */
export function useAffectationsModel(
  files: readonly SessionNominationFile[],
): InternalFilesAffectationsContextType {
  const [state, dispatch] = React.useReducer(reducer, files, stateInitializer);
  React.useEffect(() => {
    dispatch({ type: 'init', files });
  }, [files, dispatch]);

  const hasChanges = React.useMemo(() => state.hasChanges, [state]);

  const getAffectations = React.useCallback(() => state.toJSON(), [state]);

  const prioritize = React.useCallback(
    (priorities: Record<string, Set<PrioriteEnum>>) => dispatch({ type: 'prioritize', priorities }),
    [dispatch],
  );

  const affectReporters = React.useCallback(
    (affectations: Record<string, readonly string[]>) => dispatch({ type: 'affect', affectations }),
    [dispatch],
  );

  const resetAffectations = React.useCallback(() => dispatch({ type: 'reset' }), [dispatch]);

  return {
    root: state,
    hasChanges,
    prioritize,
    affectReporters,
    getAffectations,
    resetAffectations,
  };
}

export function useAffectations(): FilesAffectationsContextType {
  const ctx = React.useContext(FilesAffectationsContext);
  if (!ctx) throw new Error(`Unknown "FilesAffectationsContext"`);

  return ctx;
}

export function useAffectationRow(fileId: string): {
  reporterIds: string[] | undefined;
  priorities: PrioriteEnum[] | undefined;
  prioritize: (priority: Set<PrioriteEnum>) => void;
  affectReporters: (reporterIds: readonly string[]) => void;
} {
  const {
    root,
    prioritize: rootPrioritize,
    affectReporters: rootAffectReporters,
  } = useAffectations() as InternalFilesAffectationsContextType;

  const file = React.useMemo(() => root.affectations.get(fileId)?.toJSON(), [root, fileId]);
  const reporterIds = React.useMemo(() => (file ? [...file.reporterIds] : undefined), [file]);

  const prioritize = React.useCallback(
    (priorities: Set<PrioriteEnum>) => {
      rootPrioritize({ [fileId]: priorities });
    },
    [fileId, rootPrioritize],
  );

  const affectReporters = React.useCallback(
    (reporterIds: readonly string[]) => {
      rootAffectReporters({ [fileId]: reporterIds });
    },
    [fileId, rootAffectReporters],
  );

  return { priorities: file?.priorities, reporterIds, prioritize, affectReporters };
}
