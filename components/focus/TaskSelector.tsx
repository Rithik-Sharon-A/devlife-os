import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Task } from "../../types";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { uiTheme } from "../ui/theme";

interface TaskSelectorProps {
  tasks: Task[];
  selectedTaskId?: string;
  onSelect: (taskId?: string) => void;
}

export function TaskSelector({ tasks, selectedTaskId, onSelect }: TaskSelectorProps) {
  const [open, setOpen] = useState(false);

  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (a.isMIT && !b.isMIT) return -1;
        if (!a.isMIT && b.isMIT) return 1;
        return Number(a.isCompleted) - Number(b.isCompleted);
      }),
    [tasks]
  );

  const selected = tasks.find((t) => t.id === selectedTaskId);

  return (
    <View>
      <Pressable
        style={[styles.trigger, selected && styles.triggerSelected]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.text}>{selected ? selected.title : "General focus"}</Text>
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Select task">
        <Button
          label="General focus"
          variant={!selectedTaskId ? "primary" : "secondary"}
          onPress={() => {
            onSelect(undefined);
            setOpen(false);
          }}
        />
        <View style={styles.list}>
          {sorted.map((task) => (
            <Button
              key={task.id}
              label={`${task.isMIT ? "⭐ " : ""}${task.title}`}
              variant={selectedTaskId === task.id ? "primary" : "secondary"}
              onPress={() => {
                onSelect(task.id);
                setOpen(false);
              }}
            />
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    backgroundColor: uiTheme.surface2,
    borderRadius: uiTheme.radiusInput,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: uiTheme.border,
  },
  triggerSelected: {
    borderLeftColor: uiTheme.accent,
    backgroundColor: uiTheme.surface3,
  },
  text: {
    color: uiTheme.textPrimary,
  },
  list: {
    marginTop: 10,
    gap: 8,
  },
});
