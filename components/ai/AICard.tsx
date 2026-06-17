import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAI } from "../../hooks/useAI";
import { useAppStore } from "../../store/useAppStore";
import { Card } from "../ui/Card";
import { uiTheme } from "../ui/theme";

function ShimmerBlock() {
  return <View style={styles.shimmer} />;
}

export function AICard({ refreshToken = 0 }: { refreshToken?: number }) {
  const { getMorningNudge } = useAI();
  const aiConfig = useAppStore((s) => s.aiConfig);
  const isConfigured = Boolean(aiConfig?.apiKey && aiConfig.model);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nudge, setNudge] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const text = await getMorningNudge();
      setNudge(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load nudge.");
    } finally {
      setLoading(false);
    }
  }, [getMorningNudge]);

  useEffect(() => {
    if (isConfigured) void refresh();
  }, [isConfigured, refreshToken, refresh]);

  if (!isConfigured) return null;

  return (
    <Card variant="elevated">
      <View style={styles.row}>
        <Text style={styles.title}>Morning nudge</Text>
        <Pressable onPress={refresh} accessibilityLabel="Refresh nudge">
          <Text style={styles.refresh}>↻</Text>
        </Pressable>
      </View>

      {loading ? <ShimmerBlock /> : null}

      {!loading && error ? (
        <View>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={refresh}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error ? <Text style={styles.body}>{nudge}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: uiTheme.textPrimary,
    fontWeight: "700",
    fontSize: 17,
  },
  refresh: {
    color: uiTheme.accent,
    fontWeight: "700",
    fontSize: 22,
    lineHeight: 24,
  },
  shimmer: {
    marginTop: 10,
    height: 46,
    borderRadius: uiTheme.radiusInput,
    backgroundColor: uiTheme.surface3,
    opacity: 0.6,
  },
  body: {
    marginTop: 10,
    color: uiTheme.textPrimary,
    lineHeight: 20,
  },
  error: {
    marginTop: 10,
    color: uiTheme.danger,
  },
  retry: {
    marginTop: 6,
    color: uiTheme.accent,
    fontWeight: "700",
  },
});
