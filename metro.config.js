const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ensure web platform gets proper module resolution
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

module.exports = withNativeWind(config, { input: "./global.css" });
