import { DateOnly } from "../../../../shared-kernel/core-logic/models/date-only";
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
      data?.map(({ id, name: title, dueDate }) => {
        const { href, onClick } = getAnchorAttributes(id);

        const dueDateFormatted = dueDate
          ? new DateOnly(
              dueDate.year,
              dueDate.month,
              dueDate.day,
            ).toFormattedString()
          : null;

        return { id, title, dueDate: dueDateFormatted, href, onClick };
      }) ?? [],
  }),
);
