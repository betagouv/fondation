import { useEffect } from "react";
import { Transparency } from "shared-models";
import { getTransparencyAttachmentsFactory } from "../../../core-logic/use-cases/transparency-attachments/get-transparency-attachments";
import { useAppDispatch, useAppSelector } from "./react-redux";
import { selectGdsTransparencyAttachmentsFactory } from "../selectors/selectTransparencyAttachments";

export const useTransparencyAttachments = (transparency?: Transparency) => {
  const dispatch = useAppDispatch();

  const transparencyArgs = transparency
    ? {
        transparency,
      }
    : undefined;
  const defaultEmptyAttachments = { files: [] };
  const selectTransparencyAttachments =
    selectGdsTransparencyAttachmentsFactory();

  const attachments = useAppSelector((state) =>
    transparencyArgs
      ? selectTransparencyAttachments(state, transparencyArgs)
      : defaultEmptyAttachments,
  );

  useEffect(() => {
    if (transparency)
      dispatch(getTransparencyAttachmentsFactory()({ transparency }));
  }, [dispatch, transparency]);

  return attachments;
};
