const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite web needs .wasm bundled as an asset (wa-sqlite.wasm + worker)
config.resolver.assetExts.push('wasm');

module.exports = config;
