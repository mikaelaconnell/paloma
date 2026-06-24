import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import { Trip, TripMember } from "../types";

interface ItineraryDay {
  id: string;
  date: string;
  location: string;
  items: ItineraryItem[];
}

interface ItineraryItem {
  id: string;
  title: string;
  note: string | null;
  time: string | null;
  type: string;
  done: boolean;
}

const typeIcons: Record<string, string> = {
  travel: "airplane-outline",
  food: "restaurant-outline",
  activity: "sunny-outline",
  explore: "compass-outline",
  special: "sparkles",
  accommodation: "bed-outline",
};

const typeColors: Record<string, string> = {
  travel: colors.mediterranean[100],
  food: colors.terracotta[50],
  activity: colors.lemon[50],
  explore: colors.olive[50],
  special: colors.terracotta[50],
  accommodation: colors.sand[100],
};

const typeTextColors: Record<string, string> = {
  travel: colors.mediterranean[600],
  food: colors.terracotta[400],
  activity: colors.lemon[400],
  explore: colors.olive[400],
  special: colors.terracotta[400],
  accommodation: colors.mediterranean[500],
};

interface Props {
  trip: Trip;
  userId: string;
  members: TripMember[];
}

export default function ItineraryTab({ trip, userId, members }: Props) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("activity");

  // Generate days from trip dates
  const days: ItineraryDay[] = [];
  const start = new Date(trip.start_date + "T00:00:00");
  const end = new Date(trip.end_date + "T00:00:00");
  const current = new Date(start);
  let dayNum = 1;

  while (current <= end) {
    days.push({
      id: current.toISOString().split("T")[0],
      date: current.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
      location: "",
      items: [],
    });
    current.setDate(current.getDate() + 1);
    dayNum++;
  }

  // TODO: Replace with Supabase data
  const [localItems, setLocalItems] = useState<
    Record<string, ItineraryItem[]>
  >({});

  const addItem = (dayId: string) => {
    if (!newTitle.trim()) return;
    const item: ItineraryItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      note: null,
      time: null,
      type: newType,
      done: false,
    };
    setLocalItems((prev) => ({
      ...prev,
      [dayId]: [...(prev[dayId] || []), item],
    }));
    setNewTitle("");
    setAddingToDay(null);
  };

  const toggleDone = (dayId: string, itemId: string) => {
    setLocalItems((prev) => ({
      ...prev,
      [dayId]: (prev[dayId] || []).map((i) =>
        i.id === itemId ? { ...i, done: !i.done } : i
      ),
    }));
  };

  const deleteItem = (dayId: string, itemId: string) => {
    Alert.alert("Delete", "Remove this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setLocalItems((prev) => ({
            ...prev,
            [dayId]: (prev[dayId] || []).filter((i) => i.id !== itemId),
          }));
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {days.map((day, idx) => {
        const items = localItems[day.id] || [];
        const isExpanded = expandedDay === day.id;

        return (
          <View key={day.id} style={styles.dayCard}>
            <TouchableOpacity
              style={styles.dayHeader}
              onPress={() => setExpandedDay(isExpanded ? null : day.id)}
              activeOpacity={0.7}
            >
              <View style={styles.dayNumber}>
                <Text style={styles.dayNumberText}>{idx + 1}</Text>
              </View>
              <View style={styles.dayInfo}>
                <Text style={styles.dayDate}>{day.date}</Text>
                <Text style={styles.dayItemCount}>
                  {items.length} {items.length === 1 ? "item" : "items"}
                </Text>
              </View>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.dayContent}>
                {items.length === 0 && addingToDay !== day.id && (
                  <View style={styles.emptyDay}>
                    <Text style={styles.emptyDayText}>
                      No plans yet for this day
                    </Text>
                  </View>
                )}

                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemRow}
                    onLongPress={() => deleteItem(day.id, item.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.itemIcon,
                        { backgroundColor: typeColors[item.type] || colors.mediterranean[50] },
                      ]}
                    >
                      <Ionicons
                        name={(typeIcons[item.type] || "ellipse-outline") as any}
                        size={14}
                        color={typeTextColors[item.type] || colors.mediterranean[500]}
                      />
                    </View>
                    <View style={styles.itemContent}>
                      <Text
                        style={[
                          styles.itemTitle,
                          item.done && styles.itemTitleDone,
                        ]}
                      >
                        {item.title}
                      </Text>
                      {item.note && (
                        <Text style={styles.itemNote}>{item.note}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleDone(day.id, item.id)}
                      style={[
                        styles.checkBtn,
                        item.done && styles.checkBtnDone,
                      ]}
                    >
                      {item.done && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.white}
                        />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}

                {/* Add item form */}
                {addingToDay === day.id ? (
                  <View style={styles.addForm}>
                    <View style={styles.typeRow}>
                      {Object.keys(typeIcons).map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.typePill,
                            newType === type && styles.typePillActive,
                          ]}
                          onPress={() => setNewType(type)}
                        >
                          <Ionicons
                            name={typeIcons[type] as any}
                            size={14}
                            color={
                              newType === type
                                ? colors.white
                                : colors.textLight
                            }
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.addInputRow}>
                      <TextInput
                        style={styles.addInput}
                        placeholder="What's the plan?"
                        placeholderTextColor={colors.textLight}
                        value={newTitle}
                        onChangeText={setNewTitle}
                        autoFocus
                        onSubmitEditing={() => addItem(day.id)}
                      />
                      <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => addItem(day.id)}
                      >
                        <Ionicons
                          name="add"
                          size={20}
                          color={colors.white}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addTrigger}
                    onPress={() => setAddingToDay(day.id)}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color={colors.mediterranean[400]}
                    />
                    <Text style={styles.addTriggerText}>Add activity</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 100, gap: spacing.sm },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mediterranean[600],
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumberText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.white,
  },
  dayInfo: { flex: 1 },
  dayDate: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.mediterranean[700],
  },
  dayItemCount: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
  },
  dayContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  emptyDay: { paddingVertical: spacing.md, alignItems: "center" },
  emptyDayText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textLight,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
  },
  itemIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: { flex: 1 },
  itemTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text,
  },
  itemTitleDone: {
    textDecorationLine: "line-through",
    color: colors.textLight,
  },
  itemNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
  },
  checkBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBtnDone: {
    backgroundColor: colors.olive[400],
    borderColor: colors.olive[400],
  },
  addForm: { marginTop: spacing.sm },
  typeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.sm,
  },
  typePill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.mediterranean[50],
    alignItems: "center",
    justifyContent: "center",
  },
  typePillActive: {
    backgroundColor: colors.mediterranean[600],
  },
  addInputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  addInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.sand[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.mediterranean[600],
    alignItems: "center",
    justifyContent: "center",
  },
  addTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  addTriggerText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.mediterranean[400],
  },
});
