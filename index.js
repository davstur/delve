if (process.env.EXPO_PUBLIC_STORYBOOK === 'true') {
  const { registerRootComponent } = require('expo');
  const StorybookUI = require('./.rnstorybook').default;
  if (!StorybookUI) {
    throw new Error(
      'Storybook UI failed to load. Run "npx sb-rn-get-stories" to regenerate .rnstorybook/storybook.requires.ts, then try again.'
    );
  }
  registerRootComponent(StorybookUI);
} else {
  require('expo-router/entry');
}
