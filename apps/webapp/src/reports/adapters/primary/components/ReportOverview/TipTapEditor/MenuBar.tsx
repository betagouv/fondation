import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import clsx from "clsx";
import { FC, useEffect } from "react";
import { ReportFileUsage } from "shared-models";
import { attachReportFile } from "../../../../../core-logic/use-cases/report-attach-file/attach-report-file";
import { deleteReportAttachedFile } from "../../../../../core-logic/use-cases/report-attached-file-deletion/delete-report-attached-file";
import { useAppDispatch, useAppSelector } from "../../../hooks/react-redux";
import { BoldButton } from "./buttons/BoldButton";
import { BulletListButton } from "./buttons/BulletListButton";
import { HeadingButton } from "./buttons/HeadingButton";
import { HighlightButton } from "./buttons/HighlightButton";
import { ImageUploadButton } from "./buttons/ImageUploadButton";
import { IndentDecreaseButton } from "./buttons/IndentDecreaseButton";
import { IndentIncreaseButton } from "./buttons/IndentIncreaseButton";
import { ItalicButton } from "./buttons/ItalicButton";
import { OrderedListButton } from "./buttons/OrderedListButton";
import { TextColorButton } from "./buttons/TextColorButton";
import { UnderlineButton } from "./buttons/UnderlineButton";
import { headingLevels } from "./constant";
import { Editor } from "@tiptap/react";

export type MenuBarProps = {
  editor: Editor;
};
export const MenuBar: FC<MenuBarProps> = ({ editor }) => {
  const dispatch = useAppDispatch();
  const lastFile = useAppSelector((state) =>
    state.reportOverview
      .byIds![
        "f6c92518-19a1-488d-b518-5c39d3ac26c7"
      ]?.attachedFiles?.filter((f) => f.usage === ReportFileUsage.EMBEDDED_SCREENSHOT)
      ?.pop(),
  );
  const filesSM = useAppSelector(
    (state) =>
      state.reportOverview.byIds!["f6c92518-19a1-488d-b518-5c39d3ac26c7"]
        ?.attachedFiles,
  );

  useEffect(() => {
    if (!editor) return;

    editor.on("update", ({ transaction }) => {
      const getImageNodes = (fragment: typeof transaction.doc.content) => {
        type ProseMirrorNode = Parameters<
          Parameters<typeof transaction.doc.content.forEach>[0]
        >[0];

        const nodes = new Set<ProseMirrorNode>();
        fragment.forEach((node) => {
          if (node.type.name === "image") {
            nodes.add(node);
          }
        });
        return nodes;
      };

      const currentNodes = getImageNodes(transaction.doc.content);
      const previousNodes = getImageNodes(transaction.before.content);

      if (currentNodes.size === 0 && previousNodes.size === 0) {
        return;
      }

      const deletedImageNodes = [...previousNodes].filter(
        (src) => !currentNodes.has(src),
      );

      if (deletedImageNodes.length > 0) {
        for (const node of deletedImageNodes) {
          const fileSMToDelete = filesSM?.find(
            (f) => f.signedUrl === node.attrs.src,
          )?.name;
          if (!fileSMToDelete) continue;
          console.log(
            "fileSMToDelete",
            filesSM?.find((f) => f.signedUrl === node.attrs.src),
          );

          dispatch(
            deleteReportAttachedFile({
              fileName: fileSMToDelete,
              reportId: "f6c92518-19a1-488d-b518-5c39d3ac26c7",
            }),
          );
        }
      }
    });
  }, [dispatch, editor, filesSM]);

  useEffect(() => {
    if (!editor || !lastFile?.signedUrl) return;
    editor
      .chain()
      .focus()
      .setImage({
        src: lastFile.signedUrl,
        alt: "capture d'écran",
        title: "capture d'écran",
      })
      .run();
  }, [dispatch, editor, lastFile?.signedUrl]);

  useEffect(() => {
    if (!editor) return;

    const insertImage = (file: File) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (typeof event.target?.result === "string") {
          const fileToUpload = new File(
            [await file.arrayBuffer()],
            `${file.name}-${Date.now()}`,
            {
              type: file.type,
            },
          );
          console.log("file", fileToUpload);
          dispatch(
            attachReportFile({
              usage: ReportFileUsage.EMBEDDED_SCREENSHOT,
              file: fileToUpload,
              reportId: "f6c92518-19a1-488d-b518-5c39d3ac26c7",
            }),
          );
        }
      };
      reader.readAsDataURL(file);
    };

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i]!.type.indexOf("image") === 0) {
          const blob = items[i]!.getAsFile();
          if (blob) {
            insertImage(blob);
            // Prevent default to stop the image from being pasted as a file
            event.preventDefault();
            break;
          }
        }
      }
    };

    // Add event listener to editor DOM element
    editor.view.dom.addEventListener("paste", handlePaste);

    return () => {
      // Clean up event listener
      editor.view.dom.removeEventListener("paste", handlePaste);
    };
  }, [dispatch, editor, lastFile?.signedUrl]);

  if (!editor) {
    return null;
  }

  return (
    <div className={clsx("sticky top-2 z-10 bg-white", cx("fr-my-4v"))}>
      <div className={clsx("gap-3", cx("fr-grid-row"))}>
        <TextColorButton />
        <HighlightButton />
        <BoldButton />
        <ItalicButton />
        <UnderlineButton />
        {headingLevels.map((level) => (
          <HeadingButton key={level} level={level} />
        ))}
        <OrderedListButton />
        <BulletListButton />
        <IndentDecreaseButton />
        <IndentIncreaseButton />
        <ImageUploadButton />
      </div>
    </div>
  );
};
