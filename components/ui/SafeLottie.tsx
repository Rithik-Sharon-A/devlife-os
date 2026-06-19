import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";

export interface LottieRef {
  play: () => void;
  reset: () => void;
  pause: () => void;
}

interface SafeLottieProps {
  source: unknown;
  style?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  resizeMode?: "contain" | "cover" | "fill";
}

const SafeLottie = forwardRef<LottieRef, SafeLottieProps>(function SafeLottie(
  props,
  ref
) {
  const nativeRef = useRef<{ play?: () => void; reset?: () => void; pause?: () => void } | null>(
    null
  );
  const isWeb = Platform.OS === "web";

  useImperativeHandle(ref, () => ({
    play: () => {
      if (!isWeb) nativeRef.current?.play?.();
    },
    reset: () => {
      if (!isWeb) nativeRef.current?.reset?.();
    },
    pause: () => {
      if (!isWeb) nativeRef.current?.pause?.();
    },
  }));

  if (isWeb) {
    return <View style={props.style} />;
  }

  const LottieView = require("lottie-react-native").default;

  return <LottieView ref={nativeRef} {...props} />;
});

export default SafeLottie;
