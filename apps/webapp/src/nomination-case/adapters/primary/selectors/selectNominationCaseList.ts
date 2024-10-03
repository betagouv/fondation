import { createAppSelector } from "../../../store/createAppSelector";

export type NominationCaseListItemVM = {
  id: string;
  name: string;
  href: string;
  onClick: () => void;
};

export type NominationCaseListVM = {
  nominationCases: NominationCaseListItemVM[];
};

export const selectNominationCaseList = createAppSelector(
  [
    (state) => state.nominationCaseList.data,
    (state) => state.router.anchorsAttributes.nominationCaseOverview,
  ],
  (data, getAnchorAttributes) => ({
    nominationCases:
      data?.map(({ id, name }) => {
        const { href, onClick } = getAnchorAttributes(id);
        return { id, name, href, onClick };
      }) ?? [],
  })
);
