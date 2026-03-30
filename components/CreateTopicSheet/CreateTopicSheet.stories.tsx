import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CreateTopicSheet } from './CreateTopicSheet';

const meta: Meta<typeof CreateTopicSheet> = {
  title: 'CreateTopicSheet',
  component: CreateTopicSheet,
  decorators: [
    (Story) => (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: '#0F0F14' }}>
          <Story />
        </View>
      </GestureHandlerRootView>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CreateTopicSheet>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: async () => {},
    isLoading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: async () => {},
    isLoading: true,
    error: null,
  },
};

export const Error: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: async () => {},
    isLoading: false,
    error: 'Something went wrong. Try again.',
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    onSubmit: async () => {},
    isLoading: false,
    error: null,
  },
};
