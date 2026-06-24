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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import { Trip, TripMember } from "../types";

interface CostEntry {
  id: string;
  description: string;
  amount: number;
  perPerson: number;
  payTo: string;
  paid: boolean;
}

interface Props {
  trip: Trip;
  userId: string;
  members: TripMember[];
}

export default function CostsTab({ trip, userId, members }: Props) {
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [payTo, setPayTo] = useState("");

  const memberCount = Math.max(members.length, 1);

  const addCost = () => {
    const amt = parseFloat(amount);
    if (!desc.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert("Missing info", "Enter a description and valid amount.");
      return;
    }

    setCosts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        description: desc.trim(),
        amount: amt,
        perPerson: Math.round((amt / memberCount) * 100) / 100,
        payTo: payTo.trim() || "TBD",
        paid: false,
      },
    ]);
    setDesc("");
    setAmount("");
    setPayTo("");
    setShowAdd(false);
  };

  const togglePaid = (id: string) => {
    setCosts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, paid: !c.paid } : c))
    );
  };

  const deleteCost = (id: string) => {
    Alert.alert("Delete", "Remove this expense?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setCosts((prev) => prev.filter((c) => c.id !== id)),
      },
    ]);
  };

  const totalAmount = costs.reduce((s, c) => s + c.amount, 0);
  const totalPerPerson = costs.reduce((s, c) => s + c.perPerson, 0);
  const paidCount = costs.filter((c) => c.paid).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Total card */}
      <LinearGradient
        colors={[colors.mediterranean[600], colors.mediterranean[500]]}
        style={styles.totalCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.totalDecoCircle} />
        <Text style={styles.totalLabel}>Per Person Total</Text>
        <Text style={styles.totalAmount}>
          ${totalPerPerson.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </Text>
        <Text style={styles.totalSub}>
          ${totalAmount.toLocaleString()} total across {memberCount} people
        </Text>
        {costs.length > 0 && (
          <Text style={styles.paidStatus}>
            {paidCount}/{costs.length} expenses paid
          </Text>
        )}
      </LinearGradient>

      {/* Add button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAdd(!showAdd)}
      >
        <Ionicons
          name={showAdd ? "close" : "add-circle-outline"}
          size={20}
          color={colors.mediterranean[600]}
        />
        <Text style={styles.addButtonText}>
          {showAdd ? "Cancel" : "Add Expense"}
        </Text>
      </TouchableOpacity>

      {/* Add form */}
      {showAdd && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="What's the expense? (e.g. Hotel, Car rental)"
            placeholderTextColor={colors.textLight}
            value={desc}
            onChangeText={setDesc}
            autoFocus
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Total amount"
              placeholderTextColor={colors.textLight}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Pay to (optional)"
              placeholderTextColor={colors.textLight}
              value={payTo}
              onChangeText={setPayTo}
            />
          </View>
          {amount && !isNaN(parseFloat(amount)) && (
            <Text style={styles.splitPreview}>
              = ${(parseFloat(amount) / memberCount).toFixed(2)} per person
            </Text>
          )}
          <TouchableOpacity style={styles.submitBtn} onPress={addCost}>
            <Text style={styles.submitBtnText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Costs list */}
      {costs.map((cost) => (
        <TouchableOpacity
          key={cost.id}
          style={[styles.costCard, cost.paid && styles.costCardPaid]}
          onPress={() => togglePaid(cost.id)}
          onLongPress={() => deleteCost(cost.id)}
          activeOpacity={0.7}
        >
          <View style={styles.costIcon}>
            <Ionicons
              name={cost.paid ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={cost.paid ? colors.olive[400] : colors.border}
            />
          </View>
          <View style={styles.costInfo}>
            <Text
              style={[styles.costDesc, cost.paid && styles.costDescPaid]}
            >
              {cost.description}
            </Text>
            <Text style={styles.costPayTo}>Pay: {cost.payTo}</Text>
          </View>
          <View style={styles.costAmounts}>
            <Text style={styles.costPerPerson}>${cost.perPerson}</Text>
            <Text style={styles.costPerPersonLabel}>per person</Text>
          </View>
        </TouchableOpacity>
      ))}

      {costs.length === 0 && !showAdd && (
        <View style={styles.emptyState}>
          <Ionicons
            name="card-outline"
            size={40}
            color={colors.mediterranean[200]}
          />
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptySubtitle}>
            Add hotels, flights, car rentals, and activities to split costs
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 100 },
  totalCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  totalDecoCircle: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  totalLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  totalAmount: {
    fontFamily: fonts.serif,
    fontSize: 44,
    color: colors.white,
  },
  totalSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 4,
  },
  paidStatus: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.lemon[300],
    marginTop: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  addButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.mediterranean[600],
  },
  addForm: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.sand[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  splitPreview: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.olive[400],
    textAlign: "center",
  },
  submitBtn: {
    backgroundColor: colors.mediterranean[600],
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.white,
  },
  costCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  costCardPaid: {
    opacity: 0.6,
  },
  costIcon: {},
  costInfo: { flex: 1 },
  costDesc: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.text,
  },
  costDescPaid: {
    textDecorationLine: "line-through",
  },
  costPayTo: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  costAmounts: { alignItems: "flex-end" },
  costPerPerson: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.terracotta[400],
  },
  costPerPersonLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 50,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.mediterranean[300],
  },
  emptySubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textLight,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20,
  },
});
