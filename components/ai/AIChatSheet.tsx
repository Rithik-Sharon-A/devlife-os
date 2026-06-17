import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  type FlatList as FlatListType,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAI } from "../../hooks/useAI";
import type { AIMessage } from "../../types";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { uiTheme } from "../ui/theme";

interface AIChatSheetProps {
  visible: boolean;
  onClose: () => void;
}

const suggestions = [
  "What should I eat for dinner?",
  "Help me focus for the next hour",
  "How am I doing today?",
];

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function TypingIndicator() {
  return (
    <View style={styles.typingWrap}>
      {[0, 1, 2].map((d) => (
        <View key={d} style={styles.dot} />
      ))}
    </View>
  );
}

export function AIChatSheet({ visible, onClose }: AIChatSheetProps) {
  const { sendChatMessage, isLoading, error } = useAI();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatListType<(typeof data)[number]>>(null);

  useEffect(() => {
    if (!visible) return;
    if (messages.length > 0) return;
    setMessages([
      {
        role: "assistant",
        content: "I have your daily context loaded. Ask me anything about your food, focus, hydration, or score.",
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [visible, messages.length]);

  const canSend = draft.trim().length > 0 && !isLoading;

  const submit = async (text?: string) => {
    const message = (text ?? draft).trim();
    if (!message) return;
    setDraft("");
    const userMsg: AIMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    const reply = await sendChatMessage(message, next);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: reply, timestamp: new Date().toISOString() },
    ]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const data = useMemo(
    () => messages.map((m) => ({ ...m, id: `${m.timestamp}-${id()}` })),
    [messages]
  );

  const isErrorReply = (content: string) =>
    content.startsWith("Couldn't") ||
    content.startsWith("AI is not configured") ||
    content.startsWith("Request timed out");

  return (
    <BottomSheet visible={visible} onClose={onClose} title="DayOS AI Coach" height="full">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={80}
      >
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isError = item.role === "assistant" && isErrorReply(item.content);
            return (
              <View
                style={[
                  styles.bubble,
                  item.role === "user" ? styles.userBubble : styles.aiBubble,
                  isError && styles.errorBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    item.role === "user" ? styles.userText : styles.aiText,
                    isError && styles.errorText,
                  ]}
                  maxFontSizeMultiplier={1.3}
                >
                  {item.content}
                </Text>
              </View>
            );
          }}
          ListFooterComponent={isLoading ? <TypingIndicator /> : null}
        />

        {error ? (
          <Text style={styles.errorBanner} numberOfLines={2} maxFontSizeMultiplier={1.2}>
            ⚠️ Couldn't reach AI. Check your API key in Settings.
          </Text>
        ) : null}

        <View style={styles.quickRow}>
          {suggestions.map((s) => (
            <Pressable
              key={s}
              onPress={() => void submit(s)}
              style={styles.quick}
              accessibilityRole="button"
              accessibilityLabel={`Ask: ${s}`}
            >
              <Text style={styles.quickText}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask DayOS..."
            placeholderTextColor={uiTheme.textSecondary}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => void submit()}
            accessibilityLabel="Chat input"
          />
          <Button
            label="Send"
            size="sm"
            onPress={() => void submit()}
            disabled={!canSend}
          />
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
    paddingBottom: 10,
  },
  bubble: {
    maxWidth: "84%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: uiTheme.accent,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: uiTheme.surface2,
    borderWidth: 1,
    borderColor: uiTheme.border,
  },
  errorBubble: {
    borderColor: uiTheme.danger,
    backgroundColor: `${uiTheme.danger}18`,
  },
  bubbleText: {
    lineHeight: 19,
  },
  userText: {
    color: uiTheme.textPrimary,
  },
  aiText: {
    color: uiTheme.textPrimary,
  },
  errorText: {
    color: uiTheme.danger,
  },
  errorBanner: {
    color: uiTheme.danger,
    fontSize: 12,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  typingWrap: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    paddingLeft: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: uiTheme.radiusPill,
    backgroundColor: uiTheme.textSecondary,
    opacity: 0.6,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  quick: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    backgroundColor: uiTheme.surface2,
    borderRadius: uiTheme.radiusPill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickText: {
    color: uiTheme.textSecondary,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusInput,
    backgroundColor: uiTheme.surface2,
    color: uiTheme.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
