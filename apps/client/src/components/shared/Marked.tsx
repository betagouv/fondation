import React from 'react';

export function Marked(props: { search: string; value: string }) {
  const trimmed = React.useMemo(() => props.search.trim(), [props.search]);
  const re = React.useMemo(
    () => new RegExp('^(?<pre>.*)(?<search>' + trimmed.replace(/\W/g, '.') + ')(?<post>.*)$', 'i'),
    [trimmed],
  );

  const result = React.useMemo(() => re.exec(props.value), [re, props.value]);

  if (!trimmed || !result || !result.groups) return props.value;

  return (
    <span>
      {result.groups.pre.replace(/\s/g, '\u00A0') || ''}
      <mark className="fr-py-1v rounded-xs bg-light-blue">{result.groups.search || ''}</mark>
      {result.groups.post.replace(/\s/g, '\u00A0') || ''}
    </span>
  );
}
