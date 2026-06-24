import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import { supabase } from "../lib/supabase";
import { Trip, TripMember } from "../types";
import ItineraryTab from "../components/ItineraryTab";
import MoodBoardTab from "../components/MoodBoardTab";
import PackingTab from "../components/PackingTab";
import CostsTab from "../components/CostsTab";
import PollsTab from "../components/PollsTab";

interface TripScreenProps {
  trip: Trip;
  userId: string;
  onBack: () => void;
}

type Tab = "itinerary" | "moodboard" | "polls" | "packing" | "costs";

export default function TripScreen({ trip, userId, onBack }: TripScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  const [members, setMembers] = useState<TripMember[]>([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("trip_members")
      .select("*, profiles:user_id(display_name, avatar_url)")
      .eq("trip_id", trip.id);

    if (data) setMembers(data as any);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my trip "${trip.name}" on Paloma! Use invite code: ${trip.invite_code}`,
      });
    } catch (e) {}
  };

  const daysUntil = () => {
    const diff = new Date(trip.start_date).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return null;
    if (days === 0) return "Today!";
    return `${days} days`;
  };

  const countdown = daysUntil();

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "itinerary", label: "Plan", icon: "map-outline" },
    { key: "moodboard", label: "Vibes", icon: "images-outline" },
    { key: "polls", label: "Vote", icon: "bar-chart-outline" },
    { key: "packing", label: "Pack", icon: "checkbox-outline" },
    { key: "costs", label: "Costs", icon: "card-outline" },
  ];

  return (
    <View style={styles.container}>
      {/* Hero header */}
      <LinearGradient
        colors={[colors.mediterranean[600], colors.mediterranean[400]]}
        style={styles.hero}
      >
        <View style={styles.heroHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Ionicons name="share-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.destination}>{trip.destination}</Text>
        <Text style={styles.tripName}>{trip.name}</Text>

        <View style={styles.heroMeta}>
          <Text style={styles.dates}>
            {new Date(trip.start_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            -{" "}
            {new Date(trip.end_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
          {countdown && <Text style={styles.countdown}>{countdown}</Text>}
        </View>

        {/* Members */}
        <View style={styles.membersRow}>
          {members.map((m, i) => (
            <View
              key={m.id}
              style={[
                styles.memberCircle,
                { backgroundColor: m.color, marginLeft: i > 0 ? -8 : 0 },
              ]}
            >
              <Text style={styles.memberInitial}>
                {(m as any).profiles?.display_name?.[0] || "?"}
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={styles.inviteCircle}
            onPress={handleShare}
          >
            <Ionicons name="add" size={18} color={colors.mediterranean[400]} />
          </TouchableOpacity>
        </View>

        {/* Invite code */}
        <TouchableOpacity
          style={styles.inviteCodePill}
          onPress={() => {
            Alert.alert(
              "Invite Code",
              `Share this code with friends to join:\n\n${trip.invite_code}`,
              [
                { text: "Copy & Share", onPress: handleShare },
                { text: "OK" },
              ]
            );
          }}
        >
          <Ionicons name="key-outline" size={14} color={colors.lemon[300]} />
          <Text style={styles.inviteCodeText}>{trip.invite_code}</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={
                activeTab === tab.key
                  ? colors.mediterranean[600]
                  : colors.textLight
              }
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <View style={styles.content}>
        {activeTab === "itinerary" && (
          <ItineraryTab trip={trip} userId={userId} members={members} />
        )}
        {activeTab === "moodboard" && (
          <MoodBoardTab trip={trip} userId={userId} />
        )}
        {activeTab === "polls" && (
          <PollsTab trip={trip} userId={userId} userName="You" />
        )}
        {activeTab === "packing" && (
          <PackingTab trip={trip} userId={userId} />
        )}
        {activeTab === "costs" && (
          <CostsTab trip={trip} userId={userId} members={members} />
        )}
      </View>

      {/* Floating inspo button */}
      <TouchableOpacity
        style={styles.inspoFab}
        onPress={() => {
          Alert.alert(
            "Share Inspo",
            "Paste a TikTok, Instagram, or Pinterest link to analyze it with AI.",
            [{ text: "Got it" }]
          );
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="sparkles" size={22} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    paddingTop: 56,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  destination: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  tripName: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.white,
    marginTop: 4,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  dates: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  countdown: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.lemon[300],
  },
  membersRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },
  memberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  memberInitial: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.white,
  },
  inviteCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    borderStyle: "dashed",
  },
  inviteCodePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  inviteCodeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 2,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 2,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.mediterranean[600],
  },
  tabLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textLight,
  },
  tabLabelActive: {
    fontFamily: fonts.sansSemiBold,
    color: colors.mediterranean[600],
  },
  content: {
    flex: 1,
  },
  inspoFab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.terracotta[400],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.terracotta[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
