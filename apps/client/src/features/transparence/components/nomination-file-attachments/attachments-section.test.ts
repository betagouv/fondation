import { afterEach, describe, expect, it, vi } from 'vitest';

import { attachmentsSectionId, revealAttachments } from './attachments-section';

function mountSection(nominationFileId: string) {
  const section = document.createElement('div');
  section.id = attachmentsSectionId(nominationFileId);
  section.scrollIntoView = vi.fn();
  document.body.append(section);

  return section;
}

const nextFrames = (count: number) =>
  new Promise<void>((resolve) => {
    const tick = (remaining: number) =>
      remaining === 0 ? resolve() : requestAnimationFrame(() => tick(remaining - 1));
    tick(count);
  });

afterEach(() => {
  document.body.innerHTML = '';
});

describe('revealAttachments', () => {
  it('scrolls to the section of that magistrat', () => {
    const section = mountSection('nomination-file-1');
    mountSection('nomination-file-2');

    revealAttachments('nomination-file-1');

    expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('waits for the side panel to render the section', async () => {
    revealAttachments('nomination-file-1');
    await nextFrames(2);

    const section = mountSection('nomination-file-1');
    await nextFrames(2);

    expect(section.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('gives up rather than polling forever', async () => {
    revealAttachments('nomination-file-1', 1);
    await nextFrames(4);

    const section = mountSection('nomination-file-1');
    await nextFrames(4);

    expect(section.scrollIntoView).not.toHaveBeenCalled();
  });
});
