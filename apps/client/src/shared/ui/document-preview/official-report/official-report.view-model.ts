import type { AnyExtension, JSONContent } from '@tiptap/core';

import { assertNever } from '@/utils/types.util';

import { buildOfficialReportExtensions } from './blocks';
import { OfficialReportConclusionBlock } from './blocks/OfficialReportConclusionBlock';
import { OfficialReportFileBlock } from './blocks/OfficialReportFileBlock';
import { OfficialReportIntroBlock } from './blocks/OfficialReportIntroBlock';
import { OfficialReportSectionIntroBlock } from './blocks/OfficialReportSectionIntroBlock';
import { OfficialReportSectionTitleBlock } from './blocks/OfficialReportSectionTitleBlock';
import type { OfficialReportBlock, OfficialReportBlockCallbacks } from './utils';

export class OfficialReportViewModel {
  readonly extensions: AnyExtension[];

  constructor(callbacks: OfficialReportBlockCallbacks) {
    this.extensions = buildOfficialReportExtensions(callbacks);
  }

  buildDoc(blocks: OfficialReportBlock[]): JSONContent {
    const extensions = this.extensions;
    const sorted = blocks.toSorted((a, b) => a.weight - b.weight);

    const content: JSONContent[] = [];
    let currentFileList: { type: 'fileListBlock'; content: JSONContent[] } | undefined;

    for (const block of sorted) {
      if (OfficialReportFileBlock.handles(block)) {
        if (!currentFileList) {
          currentFileList = { type: 'fileListBlock', content: [] };
        }

        currentFileList.content.push(...OfficialReportFileBlock.map(block, extensions));
        continue;
      } else {
        if (OfficialReportIntroBlock.handles(block)) {
          content.push(...OfficialReportIntroBlock.map(block, extensions));
          continue;
        }

        if (currentFileList) {
          content.push(currentFileList);
          currentFileList = undefined;
        }

        if (OfficialReportConclusionBlock.handles(block)) {
          content.push(...OfficialReportConclusionBlock.map(block, extensions));
          continue;
        }

        if (OfficialReportSectionTitleBlock.handles(block)) {
          content.push(...OfficialReportSectionTitleBlock.map(block));
          continue;
        }

        if (OfficialReportSectionIntroBlock.handles(block)) {
          content.push(...OfficialReportSectionIntroBlock.map(block, extensions));
          continue;
        }
      }

      return assertNever(block);
    }

    if (currentFileList) content.push(currentFileList);

    return { content, type: 'doc' };
  }
}
