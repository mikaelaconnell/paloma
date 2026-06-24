import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import { Trip } from "../types";

interface PackingItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Category {
  name: string;
  icon: string;
  color: string;
  items: PackingItem[];
}

const defaultCategories: Category[] = [
  {
    name: "Beach & Swim",
    icon: "water-outline",
    color: colors.mediterranean[500],
    items: [
      { id: "1", text: "Swimsuits", checked: false },
      { id: "2", text: "Sunscreen SPF 50", checked: false },
      { id: "3", text: "Sun hat", checked: false },
      { id: "4", text: "Beach towel", checked: false },
      { id: "5", text: "Coverup / sarong", checked: false },
    ],
  },
  {
    name: "Going Out",
    icon: "sparkles-outline",
    color: colors.terracotta[400],
    items: [
      { id: "6", text: "Dinner dress / jumpsuit", checked: false },
      { id: "7", text: "Heels or dressy sandals", checked: false },
      { id: "8", text: "Statement jewelry", checked: false },
      { id: "9", text: "Clutch / evening bag", checked: false },
    ],
  },
  {
    name: "Day Outfits",
    icon: "shirt-outline",
    color: colors.olive[400],
    items: [
      { id: "10", text: "Linen pants / shorts", checked: false },
      { id: "11", text: "Cute tops", checked: false },
      { id: "12", text: "Maxi dress", checked: false },
      { id: "13", text: "Walking sandals", checked: false },
      { id: "14", text: "Sunglasses", checked: false },
    ],
  },
  {
    name: "Travel Essentials",
    icon: "briefcase-outline",
    color: colors.lemon[400],
    items: [
      { id: "15", text: "Passport", checked: false },
      { id: "16", text: "Phone charger + battery", checked: false },
      { id: "17", text: "Travel adapter", checked: false },
      { id: "18", text: "Headphones", checked: false },
      { id: "19", text: "Download offline maps", checked: false },
    ],
  },
  {
    name: "Toiletries",
    icon: "heart-outline",
    color: colors.terracotta[300],
    items: [
      { id: "20", text: "Skincare (minis)", checked: false },
      { id: "21", text: "Makeup bag", checked: false },
      { id: "22", text: "Hair products", checked: false },
      { id: "23", text: "Medications", checked: false },
      { id: "24", text: "Aloe vera gel", checked: false },
    ],
  },
];

interface Props {
  trip: Trip;
  userId: string;
}

export default function PackingTab({ trip, userId }: Props) {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [newText, setNewText] = useState("");

  const toggleItem = (catIdx: number, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat, ci) =>
        ci !== catIdx
          ? cat
          : {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId
                  ? { ...item, checked: !item.checked }
                  : item
              ),
            }
      )
    );
  };

  const addItem = (catIdx: number) => {
    if (!newText.trim()) return;
    setCategories((prev) =>
      prev.map((cat, ci) =>
        ci !== catIdx
          ? cat
          : {
              ...cat,
              items: [
                ...cat.items,
                {
                  id: Date.now().toString(),
                  text: newText.trim(),
                  checked: false,
                },
              ],
            }
      )
    );
    setNewText("");
    setAddingTo(null);
  };

  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const checkedItems = categories.reduce(
    (s, c) => s + c.items.filter((i) => i.checked).length,
    0
  );
  const progress = totalItems > 0 ? checkedItems / totalItems : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {checkedItems} of {totalItems} packed
          </Text>
          <Text style={styles.progressPercent}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>

      {/* Categories */}
      {categories.map((cat, catIdx) => {
        const catChecked = cat.items.filter((i) => i.checked).length;
        return (
          <View key={cat.name} style={styles.catCard}>
            <View style={styles.catHeader}>
              <View style={styles.catLeft}>
                <View
                  style={[styles.catIcon, { backgroundColor: cat.color + "20" }]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={cat.color}
                  />
                </View>
                <Text style={styles.catName}>{cat.name}</Text>
              </View>
              <Text style={styles.catCount}>
                {catChecked}/{cat.items.length}
              </Text>
            </View>

            {cat.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemRow}
                onPress={() => toggleItem(catIdx, item.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    item.checked && styles.checkboxChecked,
                  ]}
                >
                  {item.checked && (
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  )}
                </View>
                <Text
                  style={[
                    styles.itemText,
                    item.checked && styles.itemTextChecked,
                  ]}
                >
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))}

            {addingTo === catIdx ? (
              <View style={styles.addRow}>
                <TextInput
                  style={styles.addInput}
                  placeholder="Add item..."
                  placeholderTextColor={colors.textLight}
                  value={newText}
                  onChangeText={setNewText}
                  autoFocus
                  onSubmitEditing={() => addItem(catIdx)}
                />
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => addItem(catIdx)}
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addTrigger}
                onPress={() => setAddingTo(catIdx)}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={colors.mediterranean[400]}
                />
                <Text style={styles.addTriggerText}>Add item</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 100 },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text,
  },
  progressPercent: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.olive[400],
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.mediterranean[50],
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.olive[400],
    borderRadius: 4,
  },
  catCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  catLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  catIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.mediterranean[700],
  },
  catCount: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textLight,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.olive[400],
    borderColor: colors.olive[400],
  },
  itemText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  itemTextChecked: {
    textDecorationLine: "line-through",
    color: colors.textLight,
  },
  addRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  addInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.sand[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.olive[400],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  addBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.white,
  },
  addTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: spacing.sm,
  },
  addTriggerText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.mediterranean[400],
  },
});
