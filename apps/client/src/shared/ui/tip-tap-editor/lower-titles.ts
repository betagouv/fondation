/** the editor titles start at h1, which would break the page hierarchy under the title of the page or card */
export function lowerTitles(html: string, options: { by: number }): string {
  const { body } = new DOMParser().parseFromString(html, 'text/html');

  for (const $title of body.querySelectorAll('h1, h2, h3')) {
    const $tag = body.ownerDocument.createElement('h' + (Number($title.tagName.at(1)) + options.by));

    for (const attr of $title.attributes) $tag.setAttribute(attr.name, attr.value);
    while ($title.firstChild) $tag.appendChild($title.firstChild);

    $title.replaceWith($tag);
  }

  return body.innerHTML;
}
