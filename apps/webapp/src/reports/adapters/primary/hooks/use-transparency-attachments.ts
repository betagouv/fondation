import { useEffect } from "react";
import { Magistrat, Transparency } from "shared-models";
import { getTransparencyAttachmentsFactory } from "../../../core-logic/use-cases/transparency-attachments/get-transparency-attachments";
import { selectGdsTransparencyAttachmentsFactory } from "../selectors/selectTransparencyAttachments";
import { useAppDispatch, useAppSelector } from "./react-redux";

export const useTransparencyAttachments = (
  transparency: Transparency,
  formation: Magistrat.Formation,
) => {
  const dispatch = useAppDispatch();

  const selectTransparencyAttachments =
    selectGdsTransparencyAttachmentsFactory();

  const transparencyArgs = {
    transparency,
    formation,
  };
  const attachments = useAppSelector((state) =>
    selectTransparencyAttachments(state, transparencyArgs),
  );

  useEffect(() => {
    if (transparency)
      dispatch(
        getTransparencyAttachmentsFactory()({ transparency, formation }),
      );
  }, [dispatch, transparency, formation]);

  return attachments;
};
