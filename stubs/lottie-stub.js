const React = require("react");
const { View } = require("react-native");

const LottieView = React.forwardRef(function LottieView(props, ref) {
  return React.createElement(View, {
    style: props.style,
    ref,
  });
});

module.exports = LottieView;
module.exports.default = LottieView;
module.exports.LottieView = LottieView;
