export function gradeAndPositionLabel(grade: string | null, position: string | null) {
  return [grade, position].filter(Boolean).join(' - ');
}
