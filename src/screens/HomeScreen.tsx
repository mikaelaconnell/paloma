import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import { useTrips } from "../hooks/useTrips";
import { Trip } from "../types";

interface HomeScreenProps {
  userId: string;
  displayName: string;
  onSelectTrip: (trip: Trip) => void;
  onCreateWithAI: () => void;
  onSignOut: () => void;
}

export default function HomeScreen({
  userId,
  displayName,
  onSelectTrip,
  onCreateWithAI,
  onSignOut,
}: HomeScreenProps) {
  const { trips, loading, joinTrip, refresh } = useTrips(userId);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    const result = await joinTrip(inviteCode.trim());
    setJoining(false);

    if ("error" in result) {
      Alert.alert("Oops", result.error as string);
    } else {
      setShowJoinModal(false);
      setInviteCode("");
    }
  };

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Past trip";
    if (days === 0) return "Today!";
    return `${days} days away`;
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => onSelectTrip(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[colors.mediterranean[500], colors.mediterranean[600]]}
        style={styles.tripCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.tripCardContent}>
          <Text style={styles.tripDestination}>{item.destination}</Text>
          <Text style={styles.tripName}>{item.name}</Text>
          <View style={styles.tripMeta}>
            <Text style={styles.tripDate}>
              {new Date(item.start_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(item.end_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <Text style={styles.tripCountdown}>{daysUntil(item.start_date)}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {displayName}!</Text>
          <Text style={styles.subtitle}>Where to next?</Text>
        </View>
        <TouchableOpacity onPress={onSignOut} style={styles.settingsButton}>
          <Ionicons
            name="log-out-outline"
            size={22}
            color={colors.mediterranean[400]}
          />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionPrimary}
          onPress={onCreateWithAI}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.terracotta[400], colors.lemon[300]]}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="sparkles" size={24} color={colors.white} />
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionTitle}>Plan a New Trip</Text>
              <Text style={styles.actionSubtitle}>
                AI helps you build the perfect plan
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionSecondary}
          onPress={() => setShowJoinModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons
            name="people"
            size={22}
            color={colors.mediterranean[600]}
          />
          <Text style={styles.actionSecondaryText}>Join a Trip</Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.mediterranean[400]}
          />
        </TouchableOpacity>
      </View>

      {/* Trips list */}
      <Text style={styles.sectionTitle}>Your Trips</Text>
      {loading ? (
        <ActivityIndicator
          color={colors.mediterranean[400]}
          style={{ marginTop: 40 }}
        />
      ) : trips.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="airplane-outline"
            size={48}
            color={colors.mediterranean[200]}
          />
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a new trip or join one with an invite code
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTrip}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tripList}
          showsVerticalScrollIndicator={false}
          onRefresh={refresh}
          refreshing={loading}
        />
      )}

      {/* Join trip modal */}
      <Modal visible={showJoinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Join a Trip</Text>
            <Text style={styles.modalSubtitle}>
              Enter the invite code from your friend
            </Text>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. ABC123"
              placeholderTextColor={colors.textLight}
              value={inviteCode}
              onChangeText={(t) => setInviteCode(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowJoinModal(false);
                  setInviteCode("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalJoin,
                  (!inviteCode.trim() || joining) && { opacity: 0.5 },
                ]}
                onPress={handleJoin}
                disabled={!inviteCode.trim() || joining}
              >
                {joining ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.modalJoinText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.mediterranean[600],
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textLight,
    marginTop: 2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mediterranean[50],
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionPrimary: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    shadowColor: colors.terracotta[400],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    color: colors.white,
  },
  actionSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  actionSecondary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionSecondaryText: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.mediterranean[600],
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.mediterranean[600],
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  tripList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.md,
  },
  tripCard: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    shadowColor: colors.mediterranean[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.md,
  },
  tripCardGradient: {
    padding: spacing.lg,
  },
  tripCardContent: {},
  tripDestination: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  tripName: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  tripMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripDate: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  tripCountdown: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.lemon[300],
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
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
    maxWidth: 250,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: "85%",
    maxWidth: 340,
  },
  modalTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.mediterranean[600],
    textAlign: "center",
  },
  modalSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  codeInput: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    color: colors.text,
    textAlign: "center",
    letterSpacing: 8,
    backgroundColor: colors.sand[50],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    backgroundColor: colors.mediterranean[50],
  },
  modalCancelText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.mediterranean[500],
  },
  modalJoin: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    backgroundColor: colors.mediterranean[600],
  },
  modalJoinText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.white,
  },
});
