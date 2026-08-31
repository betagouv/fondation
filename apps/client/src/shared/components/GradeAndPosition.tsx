export function GradeAndPosition(props: {
  boldGrade?: boolean;
  grade: string | null;
  position: string | null;
}) {
  if (!props.position) return null;
  if (!props.grade) return props.position;

  return (
    <span>
      <span className={props.boldGrade === false ? undefined : 'font-bold'}>{props.grade}</span>
      {` - ${props.position}`}
    </span>
  );
}
