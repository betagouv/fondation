import { withLolfiFileRequirements } from './requirements';

describe('withLolfiFileRequirements', () => {
  it('should find requirements', () => {
    const files = [
      { id: 'file-1', name: 'TYPE_JURIDICTION.xml' },
      { id: 'file-2', name: 'JURIDICTIONS.xml' },
    ];

    // oxfmt-ignore
    expect(withLolfiFileRequirements(files)).toEqual([
      { id: 'file-1', name: 'TYPE_JURIDICTION.xml', requirements: [] },
      { id: 'file-2', name: 'JURIDICTIONS.xml', requirements: [{ requiredFileId: 'file-1' }] },
    ]);
  });

  it('should keep unknown files', () => {
    const files = [
      { id: 'file-1', name: 'TYPE_JURIDICTION.xml' },
      { id: 'file-2', name: 'JURIDICTIONS.xml' },
      { id: 'file-3', name: 'unknown-file.xml' },
    ];

    // oxfmt-ignore
    expect(withLolfiFileRequirements(files)).toEqual([
      { id: 'file-1', name: 'TYPE_JURIDICTION.xml', requirements: [] },
      { id: 'file-2', name: 'JURIDICTIONS.xml', requirements: [{ requiredFileId: 'file-1' }] },
      { id: 'file-3', name: 'unknown-file.xml', requirements: [] },
    ]);
  });
});
