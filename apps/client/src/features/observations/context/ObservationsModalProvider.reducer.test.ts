import { describe, expect, it } from 'vitest';

import type { Observation } from '@queries/observations.queries';

import type { ActiveFile } from './ObservationsModalContext';
import { modalReducer, type ModalState } from './ObservationsModalProvider';

const FILE: ActiveFile = { sessionId: 'session-1', id: 'file-1', name: 'Camille DURAND' };
const OTHER_FILE: ActiveFile = { sessionId: 'session-1', id: 'file-2', name: 'Jean PETIT' };
const OBSERVATION = { id: 'obs-1', dateReception: '2026-01-02' } as Observation;

const closed: ModalState = { status: 'closed' };

describe('modalReducer', () => {
  it('opens in view mode by default', () => {
    expect(modalReducer(closed, { type: 'open', file: FILE, mode: 'view' })).toEqual({
      status: 'view',
      file: FILE,
    });
  });

  it('opens directly in create mode as a standalone flow', () => {
    expect(modalReducer(closed, { type: 'open', file: FILE, mode: 'create' })).toEqual({
      status: 'create',
      file: FILE,
      standalone: true,
    });
  });

  it('goes to create from the list, keeping it non-standalone', () => {
    const view: ModalState = { status: 'view', file: FILE };
    expect(modalReducer(view, { type: 'goCreate' })).toEqual({
      status: 'create',
      file: FILE,
      standalone: false,
    });
  });

  it('ignores goCreate when there is no active file', () => {
    expect(modalReducer(closed, { type: 'goCreate' })).toBe(closed);
  });

  it('edits from the list (no file passed) as non-standalone, reusing the current file', () => {
    const view: ModalState = { status: 'view', file: FILE };
    expect(modalReducer(view, { type: 'edit', observation: OBSERVATION })).toEqual({
      status: 'edit',
      file: FILE,
      observation: OBSERVATION,
      standalone: false,
    });
  });

  it('edits directly (file passed) as standalone, using the given file', () => {
    expect(modalReducer(closed, { type: 'edit', observation: OBSERVATION, file: OTHER_FILE })).toEqual({
      status: 'edit',
      file: OTHER_FILE,
      observation: OBSERVATION,
      standalone: true,
    });
  });

  it('ignores edit without a file and without an active file', () => {
    expect(modalReducer(closed, { type: 'edit', observation: OBSERVATION })).toBe(closed);
  });

  it('exits a non-standalone flow back to the list view', () => {
    const editing: ModalState = {
      status: 'edit',
      file: FILE,
      observation: OBSERVATION,
      standalone: false,
    };
    expect(modalReducer(editing, { type: 'exit' })).toEqual({ status: 'view', file: FILE });
  });

  it('exits a standalone flow straight to closed', () => {
    const editing: ModalState = {
      status: 'edit',
      file: FILE,
      observation: OBSERVATION,
      standalone: true,
    };
    expect(modalReducer(editing, { type: 'exit' })).toEqual({ status: 'closed' });
  });

  it('exits the bare view to closed', () => {
    const view: ModalState = { status: 'view', file: FILE };
    expect(modalReducer(view, { type: 'exit' })).toEqual({ status: 'closed' });
  });

  it('close always closes', () => {
    const editing: ModalState = {
      status: 'edit',
      file: FILE,
      observation: OBSERVATION,
      standalone: false,
    };
    expect(modalReducer(editing, { type: 'close' })).toEqual({ status: 'closed' });
  });
});
