import type { JobFile, Tree } from './job.types';

export function tree(files: readonly JobFile[]): Tree[] {
  const nodes = new Map(
    files.map((file) => {
      // eslint-disable-next-line
      const { requirements: _req, ...node } = file;
      return [file.id, { ...node, children: [] }] as const;
    })
  );

  const adjacency = files
    .flatMap((f) => f.requirements.map((r) => [r.requiredFileId, f.id] as const))
    .reduce(
      (map, [parentId, childId]) => map.set(parentId, (map.get(parentId) ?? []).concat(childId)),
      new Map<string, string[]>()
    );

  const visited = new Set<string>();

  const build = (id: string): Tree | null => {
    if (visited.has(id)) return null;
    visited.add(id);

    const file = nodes.get(id);
    if (!file) return null;

    const children = (adjacency.get(id) ?? []).map(build).filter((x): x is Tree => !!x);
    const size = children.reduce((sum, c) => sum + c.size, 1);
    return { ...file, size, children };
  };

  return files
    .filter((f) => f.requirements.length === 0 && f.name !== 'POSTES.xml')
    .map((f) => build(f.id))
    .filter((x): x is Tree => !!x)
    .sort((a, b) => a.size - b.size);
}
