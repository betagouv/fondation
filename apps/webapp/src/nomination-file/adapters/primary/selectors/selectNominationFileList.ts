import { format } from "date-fns";
import { createAppSelector } from "../../../store/createAppSelector";

export type NominationFileListItemVM = {
  id: string;
  title: string;
  dueDate: string | null;
  href: string;
  onClick: () => void;
};

export type NominationFileListVM = {
  nominationFiles: NominationFileListItemVM[];
};

export const selectNominationFileList = createAppSelector(
  [
    (state) => state.nominationCaseList.data,
    (state) => state.router.anchorsAttributes.nominationFileOverview,
  ],
  (data, getAnchorAttributes) => ({
    nominationFiles:
      data?.map(({ id, title, dueDate }) => {
        const { href, onClick } = getAnchorAttributes(id);

        const dueDateFormatted = dueDate
          ? format(new Date(dueDate), "dd/MM/yyyy")
          : null;

        return { id, title, dueDate: dueDateFormatted, href, onClick };
      }) ?? [],
  })
);
