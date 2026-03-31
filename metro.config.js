const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// withStorybook has ESM compat issues — stories load fine without it
// since .rnstorybook/storybook.requires.ts handles story discovery
module.exports = config;
