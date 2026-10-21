import { load } from 'cheerio';

export type AttributeRule = (value: string) => boolean;

export type AttributesByTag = ReadonlyMap<string, ReadonlyMap<string, AttributeRule>>;

/** keeps the tags and the attributes of the table, and unwraps any other tag to its text rather than drop it */
export function sanitizeHtml(html: string, attributesByTag: AttributesByTag): string {
  const $ = load(html, null, false);

  $('iframe, noscript, script, style, template, textarea, title').remove();
  $('*').each((_, element) => {
    if (!('attribs' in element)) return;

    const rules = attributesByTag.get(element.name);
    if (!rules) $(element).replaceWith($(element).contents());
    else
      element.attribs = Object.fromEntries(
        Object.entries(element.attribs).filter(([name, value]) => rules.get(name)?.(value)),
      );
  });
  $.root()
    .find('*')
    .addBack()
    .contents()
    .filter((_, node) => node.type === 'comment')
    .remove();

  return $.html();
}
