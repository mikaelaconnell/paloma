import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import { Trip } from "../types";

interface MoodItem {
  id: string;
  type: "image" | "text" | "link";
  content: string;
  caption: string | null;
  source: string | null;
}

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - spacing.md * 3) / 2;

interface Props {
  trip: Trip;
  userId: string;
}

export default function MoodBoardTab({ trip, userId }: Props) {
  const [items, setItems] = useState<MoodItem[]>([]);
  const [noteText, setNoteText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const newItems: MoodItem[] = result.assets.map((asset) => ({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        type: "image" as const,
        content: asset.uri,
        caption: null,
        source: null,
      }));
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "text",
        content: noteText.trim(),
        caption: null,
        source: null,
      },
    ]);
    setNoteText("");
  };

  const removeItem = (id: string) => {
    Alert.alert("Remove", "Remove from mood board?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setItems((prev) => prev.filter((i) => i.id !== id)),
      },
    ]);
  };

  // Split items into two columns for masonry
  const col1: MoodItem[] = [];
  const col2: MoodItem[] = [];
  items.forEach((item, i) => {
    if (i % 2 === 0) col1.push(item);
    else col2.push(item);
  });

  const renderItem = (item: MoodItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.moodItem}
      onLongPress={() => removeItem(item.id)}
      activeOpacity={0.9}
    >
      {item.type === "image" || item.type === "link" ? (
        <View style={styles.imageCard}>
          <Image
            source={{ uri: item.content }}
            style={styles.moodImage}
            resizeMode="cover"
          />
          {item.caption && (
            <Text style={styles.imageCaption}>{item.caption}</Text>
          )}
          {item.source && (
            <View style={styles.sourceRow}>
              <Ionicons
                name="link-outline"
                size={10}
                color={colors.textLight}
              />
              <Text style={styles.sourceText}>{item.source}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>&ldquo;{item.content}&rdquo;</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
            <Ionicons
              name="camera-outline"
              size={20}
              color={colors.terracotta[400]}
            />
            <Text style={styles.actionText}>Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setShowInput(!showInput)}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={colors.mediterranean[500]}
            />
            <Text style={styles.actionText}>Note</Text>
          </TouchableOpacity>
        </View>

        {/* Note input */}
        {showInput && (
          <View style={styles.inputCard}>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a vibe, idea, or note..."
              placeholderTextColor={colors.textLight}
              value={noteText}
              onChangeText={setNoteText}
              multiline
              autoFocus
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowInput(false);
                  setNoteText("");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addNoteBtn,
                  !noteText.trim() && { opacity: 0.4 },
                ]}
                onPress={() => {
                  addNote();
                  setShowInput(false);
                }}
                disabled={!noteText.trim()}
              >
                <Text style={styles.addNoteBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Masonry grid */}
        {items.length > 0 ? (
          <View style={styles.masonry}>
            <View style={styles.column}>{col1.map(renderItem)}</View>
            <View style={styles.column}>{col2.map(renderItem)}</View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="images-outline"
                size={40}
                color={colors.mediterranean[200]}
              />
            </View>
            <Text style={styles.emptyTitle}>Start your mood board</Text>
            <Text style={styles.emptySubtitle}>
              Upload photos, add notes, and collect inspo for your trip
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text,
  },
  inputCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteInput: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: "top",
  },
  inputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textLight,
  },
  addNoteBtn: {
    backgroundColor: colors.mediterranean[600],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  addNoteBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.white,
  },
  masonry: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  column: {
    flex: 1,
    gap: spacing.sm,
  },
  moodItem: {},
  imageCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodImage: {
    width: "100%",
    height: COLUMN_WIDTH * 1.2,
  },
  imageCaption: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textLight,
    padding: spacing.sm,
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sourceText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.textLight,
  },
  noteCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    color: colors.mediterranean[600],
    lineHeight: 22,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
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
    maxWidth: 260,
    lineHeight: 20,
  },
});
