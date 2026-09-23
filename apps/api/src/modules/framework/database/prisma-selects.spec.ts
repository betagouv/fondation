import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import ts from 'typescript';

const SRC_DIR = join(__dirname, '../../..');

/** TypeScript checks neither a select nor an include given to Prisma, only a `satisfies` above it makes it do so */
function uncheckedSelects(file: string): string[] {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const unchecked: string[] = [];

  (function visit(node: ts.Node, checked: boolean) {
    const isSelect =
      (ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node)) &&
      ['include', 'select'].includes(node.name.getText());
    const isSatisfied = ts.isPropertyAssignment(node) && ts.isSatisfiesExpression(node.initializer);

    if (isSelect && !checked && !isSatisfied) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart());
      unchecked.push(`${relative(SRC_DIR, file)}:${line + 1}`);
    }
    ts.forEachChild(node, (child) => visit(child, checked || ts.isSatisfiesExpression(node)));
  })(source, false);

  return unchecked;
}

describe('Prisma selects', () => {
  it('should all be checked by the compiler', () => {
    const files = readdirSync(SRC_DIR, { encoding: 'utf8', recursive: true })
      .filter((path) => path.endsWith('.ts') && !path.endsWith('.spec.ts') && !path.startsWith('generated'))
      .map((path) => join(SRC_DIR, path));

    expect(
      files.flatMap(uncheckedSelects),
      'each select and include given to Prisma needs `satisfies Prisma.<Model>Select`, see CLAUDE.md',
    ).toEqual([]);
  });
});
