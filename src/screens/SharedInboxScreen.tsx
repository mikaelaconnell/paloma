import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import { Trip, SharedContent } from "../types";
import SharedContentCard from "../components/SharedContentCard";

interface Props {
  trip: Trip;
  userId: string;
  onBack: () => void;
}

export default function SharedInboxScreen({ trip, userId, onBack }: Props) {
  const [items, setItems] = useState<SharedContent[]>([]);
  const [pasteUrl, setPasteUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const detectPlatform = (url: string): SharedContent["source_platform"] => {
    if (url.includes("tiktok.com") || url.includes("vm.tiktok")) return "tiktok";
    if (url.includes("instagram.com") || url.includes("instagr.am")) return "instagram";
    if (url.includes("pinterest.com") || url.includes("pin.it")) return "pinterest";
    return "other";
  };

  const handlePasteLink = async () => {
    const url = pasteUrl.trim();
    if (!url) return;

    const newItem: SharedContent = {
      id: Date.now().toString(),
      trip_id: trip.id,
      source_url: url,
      source_platform: detectPlatform(url),
      thumbnail_url: null,
      ai_analysis: null,
      user_notes: null,
      status: "pending",
      added_to_day_id: null,
      shared_by: userId,
      created_at: new Date().toISOString(),
    };

    setItems((prev) => [newItem, ...prev]);
    setPasteUrl("");
    setAnalyzing(true);

    // TODO: Call Supabase edge function to analyze content
    // For now, simulate AI analysis
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === newItem.id
            ? {
                ...item,
                status: "analyzed" as const,
                thumbnail_url: null,
                ai_analysis: {
                  type: "restaurant" as const,
                  name: "Analyzing...",
                  location: trip.destination,
                  description:
                    "AI will analyze the content from this link and identify what it is - restaurant, hotel, activity, etc.",
                  tags: ["from " + detectPlatform(url)],
                  suggested_day_type: "food" as const,
                  confidence: 0.85,
                },
              }
            : item
        )
      );
      setAnalyzing(false);
    }, 2000);
  };

  const handleAddToItinerary = (content: SharedContent, dayId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === content.id
          ? { ...item, status: "added" as const, added_to_day_id: dayId }
          : item
      )
    );
    Alert.alert("Added!", "This has been added to your itinerary.");
  };

  const handleAddToMoodBoard = (content: SharedContent) => {
    Alert.alert("Saved!", "Added to your mood board.");
    setItems((prev) =>
      prev.map((item) =>
        item.id === content.id ? { ...item, status: "added" as const } : item
      )
    );
  };

  const handleDismiss = (content: SharedContent) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === content.id
          ? { ...item, status: "dismissed" as const }
          : item
      )
    );
  };

  const handleUpdateNotes = (content: SharedContent, notes: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === content.id ? { ...item, user_notes: notes } : item
      )
    );
  };

  // Generate day options from trip dates
  const dayOptions: { id: string; label: string }[] = [];
  const start = new Date(trip.start_date + "T00:00:00");
  const end = new Date(trip.end_date + "T00:00:00");
  const current = new Date(start);
  let dayNum = 1;
  while (current <= end) {
    dayOptions.push({
      id: current.toISOString().split("T")[0],
      label: `Day ${dayNum} - ${current.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`,
    });
    current.setDate(current.getDate() + 1);
    dayNum++;
  }

  const activeItems = items.filter((i) => i.status !== "dismissed" && i.status !== "added");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.mediterranean[600]}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="sparkles" size={18} color={colors.terracotta[400]} />
          <Text style={styles.headerTitle}>Shared Inspo</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Paste link input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>
          Paste a link from TikTok, Instagram, or Pinterest
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.urlInput}
            placeholder="https://..."
            placeholderTextColor={colors.textLight}
            value={pasteUrl}
            onChangeText={setPasteUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onSubmitEditing={handlePasteLink}
          />
          <TouchableOpacity
            style={[styles.analyzeBtn, !pasteUrl.trim() && { opacity: 0.4 }]}
            onPress={handlePasteLink}
            disabled={!pasteUrl.trim()}
          >
            <Ionicons name="sparkles" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.inputHint}>
          Tip: You can also share directly from TikTok or Instagram using the share button
        </Text>
      </View>

      {/* Content cards */}
      {activeItems.length > 0 ? (
        <FlatList
          data={activeItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SharedContentCard
              content={item}
              onAddToItinerary={handleAddToItinerary}
              onAddToMoodBoard={handleAddToMoodBoard}
              onDismiss={handleDismiss}
              onUpdateNotes={handleUpdateNotes}
              dayOptions={dayOptions}
            />
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="share-social-outline"
              size={40}
              color={colors.mediterranean[200]}
            />
          </View>
          <Text style={styles.emptyTitle}>No shared inspo yet</Text>
          <Text style={styles.emptySubtitle}>
            Paste a link above, or share directly from TikTok, Instagram, or
            Pinterest to Paloma
          </Text>
        </View>
      )}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.mediterranean[600],
  },
  inputSection: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  inputLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  urlInput: {
    flex: 1,
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
  analyzeBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.terracotta[400],
    alignItems: "center",
    justifyContent: "center",
  },
  inputHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textLight,
    marginTop: spacing.sm,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.mediterranean[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
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
    maxWidth: 280,
    lineHeight: 20,
  },
});
