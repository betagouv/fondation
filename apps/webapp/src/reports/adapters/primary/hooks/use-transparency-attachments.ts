import { useEffect } from "react";
import { Magistrat } from "shared-models";
import { getTransparencyAttachments } from "../../../core-logic/use-cases/transparency-attachments/get-transparency-attachments";
import { selectGdsTransparencyAttachments } from "../selectors/selectTransparencyAttachments";
import { useAppDispatch, useAppSelector } from "./react-redux";

export const useTransparencyAttachments = (
  transparency: string,
  formation: Magistrat.Formation,
) => {
  const dispatch = useAppDispatch();

  const transparencyArgs = {
    transparency,
    formation,
  };
  const attachments = useAppSelector((state) =>
    selectGdsTransparencyAttachments(state, transparencyArgs),
  );

  useEffect(() => {
    if (transparency)
      dispatch(getTransparencyAttachments({ transparency, formation }));
  }, [dispatch, transparency, formation]);

  return attachments;
};
