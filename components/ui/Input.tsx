import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { uiTheme } from "./theme";

interface InputProps extends Pick<TextInputProps, "keyboardType" | "secureTextEntry" | "returnKeyType" | "onSubmitEditing" | "autoFocus" | "maxFontSizeMultiplier"> {
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
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={uiTheme.textSecondary}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
          style={styles.input}
        />
        {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  label: {
    color: uiTheme.textSecondary,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  inputRow: {
    minHeight: 44,
    borderRadius: uiTheme.radiusInput,
    borderWidth: 1,
    borderColor: uiTheme.border,
    backgroundColor: uiTheme.surface2,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: uiTheme.textPrimary,
    fontSize: 15,
    paddingVertical: 10,
  },
  right: {
    marginLeft: 8,
  },
  error: {
    marginTop: 6,
    color: uiTheme.danger,
    fontSize: 12,
  },
  inputError: {
    borderColor: uiTheme.danger,
  },
});
