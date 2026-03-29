if (process.env.EXPO_PUBLIC_STORYBOOK === 'true') {
  const { registerRootComponent } = require('expo');
  const StorybookUI = require('./.rnstorybook').default;
  registerRootComponent(StorybookUI);
} else {
  require('expo-router/entry');
}
