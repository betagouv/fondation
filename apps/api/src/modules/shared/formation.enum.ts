export const FormationEnum = { SIEGE: 'SIEGE', PARQUET: 'PARQUET' } as const;
export type FormationEnum = (typeof FormationEnum)[keyof typeof FormationEnum];
