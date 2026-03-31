import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { CollapsibleSection } from './CollapsibleSection';

const meta: Meta<typeof CollapsibleSection> = {
  title: 'CollapsibleSection',
  component: CollapsibleSection,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: '#0F0F14', padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

export const H1Root: Story = {
  args: {
    nodeId: 'root-1',
    label: 'Surfing',
    emoji: '🏄',
    summary:
      'Surfing is a surface water sport in which an individual uses a board to ride on the forward section of a moving wave of water. Originating in Polynesian culture, surfing has evolved from ancient ritual to global phenomenon.',
    depth: 1,
    branchColor: '#4F46E5',
    sources: [],
    isExpanded: true,
    childCount: 0,
    onToggle: () => {},
  },
};

export const H2Expanded: Story = {
  args: {
    nodeId: 'branch-1',
    label: 'Origins & History',
    emoji: '🌺',
    summary:
      'Surfing originated in Polynesia, with the earliest evidence dating to 12th-century cave paintings in Hawaii. Known as heʻe nalu ("wave sliding"), it was central to Hawaiian culture and social hierarchy.',
    depth: 2,
    branchColor: '#EC4899',
    sources: [{ title: 'History of Surfing', url: 'https://example.com' }],
    isExpanded: true,
    childCount: 2,
    onToggle: () => {},
  },
};

export const H2Collapsed: Story = {
  args: {
    ...H2Expanded.args,
    isExpanded: false,
  },
};

export const H3Expanded: Story = {
  args: {
    nodeId: 'sub-1',
    label: 'Ancient Polynesian Roots',
    emoji: '🗿',
    summary:
      'The ancient Polynesians developed surfing as both a recreational activity and a spiritual practice. Chiefs demonstrated their power and status through their surfing prowess.',
    depth: 3,
    branchColor: '#EC4899',
    sources: [],
    isExpanded: true,
    childCount: 0,
    onToggle: () => {},
  },
};

export const H3Collapsed: Story = {
  args: {
    ...H3Expanded.args,
    isExpanded: false,
    childCount: 1,
  },
};

export const H4Detail: Story = {
  args: {
    nodeId: 'detail-1',
    label: 'Board Construction Methods',
    emoji: '🪵',
    summary:
      'Traditional Hawaiian surfboards were carved from single pieces of wood, often wiliwili, koa, or breadfruit. The shaping process was considered sacred.',
    depth: 4,
    branchColor: '#EC4899',
    sources: [],
    isExpanded: true,
    childCount: 0,
    onToggle: () => {},
  },
};
