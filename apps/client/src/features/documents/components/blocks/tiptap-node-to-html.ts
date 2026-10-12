import { DOMSerializer, type Node as PMNode, type Schema } from '@tiptap/pm/model';

export function tipTapNodeToHtml(node: PMNode, schema: Schema): string {
  const fragment = DOMSerializer.fromSchema(schema).serializeFragment(node.content);

  const $div = document.createElement('div');
  $div.append(fragment);
  return $div.innerHTML;
}
