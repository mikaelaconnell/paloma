import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, borderRadius } from "../lib/theme";
import { supabase } from "../lib/supabase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are a fun, enthusiastic trip planning assistant for a group travel app called Paloma. You help friend groups plan beautiful trips together.

Your job is to have a friendly conversation to understand what kind of trip they want, then help them build out the plan. Be warm, use casual language, and get excited about their ideas.

Start by asking about:
1. Where they're thinking of going (or help them decide)
2. How many people and who's coming
3. What dates work
4. What's the vibe they're going for
5. Budget range
6. Any must-dos or must-sees

After gathering enough info, offer to create their trip with a structured plan. When you have enough details, output a JSON block wrapped in \`\`\`json\`\`\` tags with this structure:
{
  "ready": true,
  "name": "Trip name",
  "destination": "Destination",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "description": "Brief description",
  "itinerary_suggestions": [
    { "date": "YYYY-MM-DD", "location": "Place", "activities": ["Activity 1", "Activity 2"] }
  ]
}

Only output the JSON when the user confirms they're ready to create the trip.`;

interface AIPlannerScreenProps {
  userId: string;
  onTripCreated: (tripId: string) => void;
  onBack: () => void;
}

export default function AIPlannerScreen({
  userId,
  onTripCreated,
  onBack,
}: AIPlannerScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! I'm so excited to help you plan a trip! Tell me - where are you and your crew thinking of going? Or if you're not sure yet, I can help you figure that out too!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Call our edge function or API route for Claude
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          system: SYSTEM_PROMPT,
        },
      });

      if (error) throw error;

      const assistantContent = data?.content || "Sorry, I had trouble thinking about that. Can you try again?";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
      };

      setMessages([...updatedMessages, assistantMessage]);

      // Check if the response contains a trip JSON
      const jsonMatch = assistantContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const tripData = JSON.parse(jsonMatch[1]);
          if (tripData.ready) {
            await createTripFromAI(tripData);
          }
        } catch (e) {
          // JSON parse error, ignore
        }
      }
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Hmm, I'm having a connection issue. Let me try again - what were you saying?",
      };
      setMessages([...updatedMessages, errorMessage]);
    }

    setLoading(false);
  };

  const createTripFromAI = async (tripData: any) => {
    const inviteCode =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        .split("")
        .sort(() => Math.random() - 0.5)
        .slice(0, 6)
        .join("");

    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        name: tripData.name,
        destination: tripData.destination,
        description: tripData.description,
        start_date: tripData.start_date,
        end_date: tripData.end_date,
        invite_code: inviteCode,
        created_by: userId,
      })
      .select()
      .single();

    if (error || !trip) {
      Alert.alert("Error", "Could not create the trip. Please try again.");
      return;
    }

    // Add creator as owner
    await supabase.from("trip_members").insert({
      trip_id: trip.id,
      user_id: userId,
      role: "owner",
      color: "#c2703e",
    });

    // Add itinerary suggestions
    if (tripData.itinerary_suggestions) {
      for (let i = 0; i < tripData.itinerary_suggestions.length; i++) {
        const daySugg = tripData.itinerary_suggestions[i];
        const { data: day } = await supabase
          .from("itinerary_days")
          .insert({
            trip_id: trip.id,
            date: daySugg.date,
            location: daySugg.location,
            sort_order: i,
          })
          .select()
          .single();

        if (day && daySugg.activities) {
          const items = daySugg.activities.map((title: string, j: number) => ({
            day_id: day.id,
            title,
            type: "activity",
            done: false,
            created_by: userId,
            sort_order: j,
          }));
          await supabase.from("itinerary_items").insert(items);
        }
      }
    }

    Alert.alert("Trip Created!", `Your trip "${tripData.name}" is ready! Share code: ${inviteCode}`, [
      { text: "Let's go!", onPress: () => onTripCreated(trip.id) },
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    // Strip JSON blocks from display
    const displayContent = item.content.replace(/```json\n[\s\S]*?\n```/g, "").trim();

    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {!isUser && (
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={14} color={colors.terracotta[400]} />
          </View>
        )}
        <View
          style={[
            styles.bubbleContent,
            isUser ? styles.userBubbleContent : styles.assistantBubbleContent,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {displayContent}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.mediterranean[600]}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="sparkles" size={18} color={colors.terracotta[400]} />
          <Text style={styles.headerTitle}>Trip Planner</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {loading && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator
            size="small"
            color={colors.terracotta[400]}
          />
          <Text style={styles.typingText}>Planning...</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Tell me about your dream trip..."
          placeholderTextColor={colors.textLight}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || loading) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
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
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageBubble: {
    flexDirection: "row",
    marginBottom: spacing.md,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    gap: spacing.sm,
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.terracotta[50],
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  bubbleContent: {
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    maxWidth: "100%",
    flexShrink: 1,
  },
  userBubbleContent: {
    backgroundColor: colors.mediterranean[600],
    borderBottomRightRadius: 4,
  },
  assistantBubbleContent: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    fontFamily: fonts.sans,
    color: colors.white,
  },
  assistantMessageText: {
    fontFamily: fonts.sans,
    color: colors.text,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  typingText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textLight,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? 34 : spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.sand[50],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.mediterranean[600],
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
