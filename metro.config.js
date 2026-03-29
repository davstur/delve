const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

if (process.env.EXPO_PUBLIC_STORYBOOK === 'true') {
  const { withStorybook } = require('@storybook/react-native/metro/withStorybook');
  module.exports = withStorybook(config, { enabled: true });
} else {
  module.exports = config;
}
