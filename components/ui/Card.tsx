import { type PropsWithChildren } from "react";
import { StyleSheet, type StyleProp, type ViewStyle, View } from "react-native";

import { shadows } from "../../utils/styles";
import { uiTheme } from "./theme";

type CardVariant = "default" | "elevated" | "bordered";

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  padded?: boolean;
}

export function Card({
  children,
  style,
  variant = "default",
  padded = true,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        variant === "elevated" && styles.elevated,
        variant === "bordered" && styles.bordered,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: uiTheme.surface1,
    borderRadius: uiTheme.radiusCard,
  },
  padded: {
    padding: 16,
  },
  elevated: {
    backgroundColor: uiTheme.surface2,
    ...shadows.medium,
  },
  bordered: {
    backgroundColor: uiTheme.surface1,
    borderWidth: 1,
    borderColor: uiTheme.border,
  },
});
