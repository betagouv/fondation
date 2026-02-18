import { dag } from './dag';

describe('DAG', () => {
  it('should sort by requirements', () => {
    const result = dag([
      { file: { id: 'file-3' }, requirements: [{ requiredFileId: 'file-1' }] },
      {
        file: { id: 'file-5' },
        requirements: [
          { requiredFileId: 'file-3' },
          { requiredFileId: 'file-2' },
        ],
      },
      { file: { id: 'file-2' }, requirements: [{ requiredFileId: 'file-1' }] },
      { file: { id: 'file-4' }, requirements: [] },
      { file: { id: 'file-1' }, requirements: [] },
    ]);

    expect(result.map(({ file }) => file.id)).toEqual([
      'file-4',
      'file-1',
      'file-3',
      'file-2',
      'file-5',
    ]);
  });

  it('should sort even with missing requirement', () => {
    const result = dag([
      { file: { id: 'file-2' }, requirements: [{ requiredFileId: 'file-1' }] },
      { file: { id: 'file-3' }, requirements: [] },
    ]);

    expect(result.map(({ file }) => file.id)).toEqual(['file-3', 'file-2']);
  });
});
