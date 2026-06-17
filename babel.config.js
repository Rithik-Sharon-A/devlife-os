module.exports = function (babel) {
  babel.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { worklets: false }],
      'nativewind/babel',
    ],
  };
};
