import { COURT_OF_APPEAL_TYPE_ID, SUPERIOR_COURT_OF_APPEAL_TYPE_ID } from '../../shared/court';

export const COURT_OF_APPEAL_HEADS: readonly { functionId: string; jurisdictionTypeId: string }[] = [
  { functionId: 'PP', jurisdictionTypeId: COURT_OF_APPEAL_TYPE_ID },
  { functionId: 'P', jurisdictionTypeId: SUPERIOR_COURT_OF_APPEAL_TYPE_ID },
];
