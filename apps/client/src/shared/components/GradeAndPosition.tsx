export function GradeAndPosition(props: { grade: string | null; position: string | null }) {
  if (!props.position) return null;
  if (!props.grade) return props.position;

  return (
    <span>
      <span className="font-bold">{props.grade}</span>
      {` - ${props.position}`}
    </span>
  );
}
