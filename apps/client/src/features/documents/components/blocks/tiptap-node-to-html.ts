import { DOMParser as SchemaParser, DOMSerializer, type Node as PMNode, type Schema } from '@tiptap/pm/model';

export function tipTapNodeToHtml(node: PMNode, schema: Schema): string {
  const fragment = DOMSerializer.fromSchema(schema).serializeFragment(node.content);

  const $div = document.createElement('div');
  $div.append(fragment);
  return $div.innerHTML;
}

/** the html as the editor would write it: what its schema cannot hold, scripts and attributes included, is dropped */
export function htmlThroughSchema(html: string, schema: Schema): string {
  // an inert document, where an image does not load nor fire its handlers while it is parsed
  const { body } = new DOMParser().parseFromString(html, 'text/html');
  return tipTapNodeToHtml(SchemaParser.fromSchema(schema).parse(body), schema);
}
