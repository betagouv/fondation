import Tag from '@codegouvfr/react-dsfr/Tag';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { STORY_AUTHORS, STORY_USERS } from '@/shared/storybook/story-users';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { authKeys } from '@queries/auth.queries';

import { FileList, FileListItem } from './FileList';

// one case per file: added by the viewer, by someone else, by nobody known, unknown size, long name, no extension
const FILES = [
  { addedBy: STORY_AUTHORS.member, id: 'file-1', name: 'cv-camille-durand.pdf', size: 248_900 },
  { addedBy: STORY_AUTHORS.sg, id: 'file-2', name: 'note-d-intention.docx', size: 24_576 },
  { addedBy: null, id: 'file-3', name: 'organigramme-juridiction.png', size: null },
  {
    addedBy: STORY_AUTHORS.member,
    id: 'file-4',
    name: 'compte-rendu-de-la-commission-d-avancement-du-premier-trimestre-2026-version-definitive.pdf',
    size: 1_310_720,
  },
  { addedBy: STORY_AUTHORS.sg, id: 'file-5', name: 'lettre-de-motivation', size: 8_192 },
];

const onDelete = fn().mockName('onDelete');
const onDownload = fn().mockName('onDownload');
const onOpen = fn().mockName('onOpen');

function FileListStory(props: { count: number; deletable: boolean; disabled: boolean; withHeader: boolean }) {
  return (
    <StoryQueryClient seed={(client) => client.setQueryData(authKeys.introspectSession(), STORY_USERS.sg)}>
      <div className="max-w-2xl">
        <FileList>
          {FILES.slice(0, props.count).map((file) => (
            <FileListItem
              addedAt="2026-06-18T08:30:00.000Z"
              addedBy={file.addedBy}
              disabled={props.disabled}
              header={props.withHeader ? <Tag small>Note d'intention</Tag> : undefined}
              key={file.id}
              name={file.name}
              onDelete={props.deletable ? onDelete : undefined}
              onDownload={onDownload}
              onOpen={onOpen}
              size={file.size}
            />
          ))}
        </FileList>
      </div>
    </StoryQueryClient>
  );
}

const meta = {
  args: { count: FILES.length, deletable: true, disabled: false, withHeader: false },
  argTypes: { count: { control: { max: FILES.length, min: 1, step: 1, type: 'range' } } },
  component: FileListStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Shared/FileList',
} satisfies Meta<typeof FileListStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
