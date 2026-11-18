/** a tribunal supérieur d'appel stands for the court of appeal in Saint-Pierre-et-Miquelon: a president heads it */
export const SUPERIOR_COURT_OF_APPEAL_TYPE_ID = 'TSA';

export const COURT_OF_APPEAL_HEADS: readonly { functionId: string; jurisdictionTypeId: string }[] = [
  { functionId: 'PP', jurisdictionTypeId: 'CA' },
  { functionId: 'P', jurisdictionTypeId: SUPERIOR_COURT_OF_APPEAL_TYPE_ID },
];
