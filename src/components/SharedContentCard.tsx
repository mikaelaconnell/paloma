import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import { SharedContent, ContentAnalysis } from "../types";

const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
  restaurant: { icon: "restaurant-outline", label: "Restaurant", color: colors.terracotta[400] },
  hotel: { icon: "bed-outline", label: "Hotel", color: colors.mediterranean[500] },
  beach: { icon: "sunny-outline", label: "Beach", color: colors.lemon[400] },
  activity: { icon: "bicycle-outline", label: "Activity", color: colors.olive[400] },
  landmark: { icon: "location-outline", label: "Landmark", color: colors.mediterranean[400] },
  nightlife: { icon: "moon-outline", label: "Nightlife", color: colors.mediterranean[600] },
  shopping: { icon: "bag-outline", label: "Shopping", color: colors.terracotta[300] },
  other: { icon: "sparkles-outline", label: "Inspo", color: colors.textLight },
};

const platformIcons: Record<string, { icon: string; color: string }> = {
  tiktok: { icon: "musical-notes-outline", color: "#000000" },
  instagram: { icon: "camera-outline", color: "#E1306C" },
  pinterest: { icon: "pin-outline", color: "#E60023" },
  other: { icon: "link-outline", color: colors.textLight },
};

interface Props {
  content: SharedContent;
  onAddToItinerary: (content: SharedContent, dayId: string) => void;
  onAddToMoodBoard: (content: SharedContent) => void;
  onDismiss: (content: SharedContent) => void;
  onUpdateNotes: (content: SharedContent, notes: string) => void;
  dayOptions: { id: string; label: string }[];
}

export default function SharedContentCard({
  content,
  onAddToItinerary,
  onAddToMoodBoard,
  onDismiss,
  onUpdateNotes,
  dayOptions,
}: Props) {
  const [notes, setNotes] = useState(content.user_notes || "");
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const analysis = content.ai_analysis;
  const typeInfo = analysis
    ? typeConfig[analysis.type] || typeConfig.other
    : typeConfig.other;
  const platform = platformIcons[content.source_platform] || platformIcons.other;

  return (
    <View style={styles.card}>
      {/* Thumbnail + Platform badge */}
      <View style={styles.imageContainer}>
        {content.thumbnail_url ? (
          <Image
            source={{ uri: content.thumbnail_url }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons
              name={platform.icon as any}
              size={32}
              color={colors.mediterranean[200]}
            />
          </View>
        )}
        <View style={[styles.platformBadge, { backgroundColor: platform.color }]}>
          <Ionicons name={platform.icon as any} size={12} color={colors.white} />
        </View>
      </View>

      {/* AI Analysis */}
      {analysis && (
        <View style={styles.analysisSection}>
          {/* Type + Confidence */}
          <View style={styles.typeRow}>
            <View style={[styles.typePill, { backgroundColor: typeInfo.color + "18" }]}>
              <Ionicons
                name={typeInfo.icon as any}
                size={14}
                color={typeInfo.color}
              />
              <Text style={[styles.typeLabel, { color: typeInfo.color }]}>
                {typeInfo.label}
              </Text>
            </View>
            {analysis.confidence >= 0.8 && (
              <View style={styles.confidenceBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.olive[400]} />
                <Text style={styles.confidenceText}>High match</Text>
              </View>
            )}
          </View>

          {/* Name + Location */}
          {analysis.name && (
            <Text style={styles.placeName}>{analysis.name}</Text>
          )}
          {analysis.location && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textLight}
              />
              <Text style={styles.locationText}>{analysis.location}</Text>
            </View>
          )}

          {/* Description */}
          <Text style={styles.description}>{analysis.description}</Text>

          {/* Tags */}
          {analysis.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {analysis.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Analyzing state */}
      {content.status === "pending" && (
        <View style={styles.analyzingState}>
          <Ionicons
            name="sparkles"
            size={20}
            color={colors.terracotta[400]}
          />
          <Text style={styles.analyzingText}>
            Analyzing what&apos;s in this...
          </Text>
        </View>
      )}

      {/* User notes */}
      <View style={styles.notesSection}>
        {isEditing ? (
          <View style={styles.notesInputWrap}>
            <TextInput
              style={styles.notesInput}
              placeholder="Add your notes... (e.g. 'This looks perfect for Tuesday dinner!')"
              placeholderTextColor={colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
              autoFocus
            />
            <TouchableOpacity
              style={styles.notesSave}
              onPress={() => {
                onUpdateNotes(content, notes);
                setIsEditing(false);
              }}
            >
              <Text style={styles.notesSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.notesDisplay}
            onPress={() => setIsEditing(true)}
          >
            {notes ? (
              <Text style={styles.notesText}>{notes}</Text>
            ) : (
              <Text style={styles.notesPlaceholder}>
                + Add notes
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionPrimary}
          onPress={() => setShowDayPicker(!showDayPicker)}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.white} />
          <Text style={styles.actionPrimaryText}>Add to Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionSecondary}
          onPress={() => onAddToMoodBoard(content)}
        >
          <Ionicons
            name="images-outline"
            size={18}
            color={colors.mediterranean[600]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionDismiss}
          onPress={() => onDismiss(content)}
        >
          <Ionicons name="close" size={18} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Day picker */}
      {showDayPicker && (
        <View style={styles.dayPicker}>
          <Text style={styles.dayPickerTitle}>Which day?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dayOptions}>
              {dayOptions.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={styles.dayOption}
                  onPress={() => {
                    onAddToItinerary(content, day.id);
                    setShowDayPicker(false);
                  }}
                >
                  <Text style={styles.dayOptionText}>{day.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  imageContainer: {
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: 200,
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: colors.mediterranean[50],
    alignItems: "center",
    justifyContent: "center",
  },
  platformBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  analysisSection: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  typeLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  confidenceText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.olive[400],
  },
  placeName: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textLight,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: colors.mediterranean[50],
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.mediterranean[500],
  },
  analyzingState: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    justifyContent: "center",
  },
  analyzingText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.terracotta[400],
  },
  notesSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  notesInputWrap: {
    gap: spacing.sm,
  },
  notesInput: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.sand[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 50,
    textAlignVertical: "top",
  },
  notesSave: {
    alignSelf: "flex-end",
    backgroundColor: colors.mediterranean[600],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  notesSaveText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.white,
  },
  notesDisplay: {
    paddingVertical: 6,
  },
  notesText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text,
    fontStyle: "italic",
  },
  notesPlaceholder: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.mediterranean[300],
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  actionPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.mediterranean[600],
    borderRadius: borderRadius.lg,
    paddingVertical: 12,
  },
  actionPrimaryText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.white,
  },
  actionSecondary: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.mediterranean[50],
    alignItems: "center",
    justifyContent: "center",
  },
  actionDismiss: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.sand[100],
    alignItems: "center",
    justifyContent: "center",
  },
  dayPicker: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  dayPickerTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  dayOptions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dayOption: {
    backgroundColor: colors.mediterranean[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  dayOptionText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.mediterranean[600],
  },
});
