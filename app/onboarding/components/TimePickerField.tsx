import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { uiTheme } from "../../../components/ui/theme";

interface TimePickerFieldProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
}

function formatTime12(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function to24Hour(hour12: number, minute: number, period: "AM" | "PM"): string {
  let hour = hour12 % 12;
  if (period === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseTime24(time: string): { hour12: number; minute: number; period: "AM" | "PM" } {
  const [hStr, mStr] = time.split(":");
  const h24 = Number(hStr);
  const minute = Number(mStr);
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const hour12 = h24 % 12 || 12;
  return { hour12, minute: Number.isNaN(minute) ? 0 : minute, period };
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];

export function TimePickerField({ label, value, onChange }: TimePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseTime24(value), [value]);
  const [hour12, setHour12] = useState(parsed.hour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed.period);

  const openPicker = () => {
    const p = parseTime24(value);
    setHour12(p.hour12);
    setMinute(p.minute);
    setPeriod(p.period);
    setOpen(true);
  };

  const confirm = () => {
    onChange(to24Hour(hour12, minute, period));
    setOpen(false);
  };

  return (
    <>
      <Pressable onPress={openPicker} style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{formatTime12(value)}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>

            <View style={styles.pickerRow}>
              <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
                {HOURS.map((h) => (
                  <Pressable
                    key={h}
                    onPress={() => setHour12(h)}
                    style={[styles.option, hour12 === h && styles.optionActive]}
                  >
                    <Text style={[styles.optionText, hour12 === h && styles.optionTextActive]}>
                      {String(h).padStart(2, "0")}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
                {MINUTES.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setMinute(m)}
                    style={[styles.option, minute === m && styles.optionActive]}
                  >
                    <Text style={[styles.optionText, minute === m && styles.optionTextActive]}>
                      {String(m).padStart(2, "0")}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.column}>
                {(["AM", "PM"] as const).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPeriod(p)}
                    style={[styles.option, period === p && styles.optionActive]}
                  >
                    <Text style={[styles.optionText, period === p && styles.optionTextActive]}>
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable onPress={confirm} style={styles.doneBtn}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: uiTheme.surface2,
    borderRadius: uiTheme.radiusInput,
    borderWidth: 1,
    borderColor: uiTheme.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  value: {
    color: uiTheme.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: uiTheme.surface1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    color: uiTheme.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  pickerRow: {
    flexDirection: "row",
    gap: 8,
    maxHeight: 220,
  },
  column: {
    flex: 1,
  },
  option: {
    paddingVertical: 10,
    borderRadius: uiTheme.radiusInput,
    alignItems: "center",
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: uiTheme.accent,
  },
  optionText: {
    color: uiTheme.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  optionTextActive: {
    color: uiTheme.textPrimary,
  },
  doneBtn: {
    marginTop: 16,
    backgroundColor: uiTheme.accent,
    borderRadius: uiTheme.radiusInput,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneText: {
    color: uiTheme.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
});
