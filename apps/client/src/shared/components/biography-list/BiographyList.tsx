export function BiographyList(props: { biography: string }) {
  const items = (props.biography.includes('\n') ? props.biography.split('\n') : props.biography.split('- '))
    .map((part) => part.trim())
    .filter((part) => !!part);

  return (
    <ul className="flex list-inside list-disc flex-col gap-2 leading-relaxed marker:text-(--text-active-blue-france)">
      {items.map((part, index) => (
        <li key={`biography_${index}`}>{part}</li>
      ))}
    </ul>
  );
}
