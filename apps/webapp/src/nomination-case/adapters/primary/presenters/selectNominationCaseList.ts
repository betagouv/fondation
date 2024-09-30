import { createAppSelector } from "../../../store/createAppSelector";

export type NominationCaseListItemVM = {
  id: string;
  name: string;
};
export type NominationCaseListVM = {
  nominationCases: NominationCaseListItemVM[];
};

export const selectNominationCaseList = createAppSelector(
  [(state) => state.nominationCaseList.data],
  (data) => ({
    nominationCases: data?.map(({ id, name }) => ({ id, name })) ?? [],
  })
);
