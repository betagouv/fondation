export function GradeAndPosition({
  boldGrade = true,
  grade,
  position,
}: {
  boldGrade?: boolean;
  grade: string | null;
  position: string | null;
}) {
  if (!position) return null;
  if (!grade) return position;

  return (
    <span>
      <span className={boldGrade ? 'font-bold' : undefined}>{grade}</span>
      {` - ${position}`}
    </span>
  );
}
