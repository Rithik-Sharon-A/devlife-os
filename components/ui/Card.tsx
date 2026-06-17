import { type PropsWithChildren } from "react";
import { useMemo } from "react";
import { StyleSheet, type StyleProp, type ViewStyle, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { getCardStyle } from "../../utils/cardStyles";
import { radii, spacing } from "../../utils/designTokens";

type CardVariant = "default" | "elevated" | "bordered" | "themed";

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  variant?: CardVariant;
  padded?: boolean;
}

export function Card({
  children,
  style,
  variant = "themed",
  padded = true,
}: CardProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        themed: getCardStyle(theme),
        default: {
          backgroundColor: theme.colors.surface1,
          borderRadius: radii.lg,
        },
        elevated: {
          backgroundColor: theme.colors.surface2,
          borderRadius: radii.lg,
        },
        bordered: {
          backgroundColor: theme.colors.surface1,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        padded: {
          padding: spacing.base,
        },
      }),
    [theme]
  );

  const variantStyle =
    variant === "themed"
      ? styles.themed
      : variant === "elevated"
        ? styles.elevated
        : variant === "bordered"
          ? styles.bordered
          : styles.default;

  return (
    <View style={[variantStyle, padded && styles.padded, style]}>{children}</View>
  );
}
