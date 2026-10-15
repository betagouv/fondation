// LOLFI pads its jurisdiction codes with spaces ("TJ  ORLEANS"): they are collapsed for display only
export function magistratGradeAndJurisdiction(magistrat: {
  grade: string | null;
  jurisdictionCode: string | null;
}): string | null {
  const jurisdiction = magistrat.jurisdictionCode?.trim().replace(/\s+/g, ' ');
  return [magistrat.grade, jurisdiction].filter(Boolean).join(' - ') || null;
}
