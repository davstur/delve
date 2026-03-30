import type { Meta, StoryObj } from '@storybook/react-native';
import { Example } from './Example';

const meta: Meta<typeof Example> = {
  title: 'Example',
  component: Example,
  args: {
    title: 'Hello Storybook',
    subtitle: 'This is an example component',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TitleOnly: Story = {
  args: {
    title: 'Just a title',
    subtitle: undefined,
  },
};

export const LongContent: Story = {
  args: {
    title: 'A Component with a Much Longer Title',
    subtitle: 'And a subtitle that also has quite a bit of text to show how wrapping works',
  },
};
