import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { radii } from "../../utils/designTokens";
import { typography } from "../../utils/typography";

interface InputProps extends Pick<
  TextInputProps,
  | "keyboardType"
  | "secureTextEntry"
  | "returnKeyType"
  | "onSubmitEditing"
  | "autoFocus"
  | "maxFontSizeMultiplier"
> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  label?: string;
  error?: string;
  rightElement?: ReactNode;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  keyboardType,
  secureTextEntry,
  returnKeyType,
  onSubmitEditing,
  autoFocus,
  maxFontSizeMultiplier = 1.4,
  rightElement,
}: InputProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [focused, setFocused] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { width: "100%" },
        label: {
          ...typography.caption,
          color: colors.textSecondary,
          marginBottom: 6,
        },
        inputRow: {
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: focused ? colors.accent : colors.border,
          backgroundColor: colors.surface2,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
        },
        inputError: {
          borderColor: colors.danger,
        },
        input: {
          flex: 1,
          color: colors.textPrimary,
          fontSize: 15,
          paddingVertical: 14,
        },
        right: { marginLeft: 8 },
        error: {
          marginTop: 6,
          color: colors.danger,
          fontSize: 12,
        },
      }),
    [colors, focused]
  );

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label.toUpperCase()}</Text> : null}
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
